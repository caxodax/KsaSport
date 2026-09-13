import { getServiceSupabase } from '@/lib/supabase';

export interface ExchangeRateResult {
  usd: number;
  eur: number;
  usdt?: number;
  usdt_promedio?: number;
  date: string; // YYYY-MM-DD
  source: 'alcambio' | 'bcv' | 'manual' | 'settings' | 'binance';
  updated_at?: string;
}

export interface RateHistoryItem {
  id: string;
  date_rate: string;
  currency: 'USD' | 'EUR' | 'USDT';
  rate: number;
  usdt_promedio?: number | null;
  source: string;
  created_at: string;
}

const PV_CARACAS_OFFSET_MS = 14400 * 1000; // 4 horas en ms (UTC-4 Venezuela)

/**
 * Calcula el rango dateSearch para la API de AlCambio.
 * Reproduce la función oficial del frontend de AlCambio:
 * Si es sábado (día 6) retrocede 1 día (viernes).
 * Si es domingo (día 0) retrocede 2 días (viernes).
 * En días de semana ordinarios, busca la ventana del día actual.
 */
export function getAlCambioDateSearch(dateObj = new Date()) {
  const t = dateObj.getTime() - PV_CARACAS_OFFSET_MS;
  const n = new Date(t);
  const day = n.getUTCDay();
  let daysToSubtract = 0;
  if (day === 6) daysToSubtract = 1;
  else if (day === 0) daysToSubtract = 2;

  const startDate = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() - daysToSubtract) + PV_CARACAS_OFFSET_MS;
  const endDate = startDate + 480 * 60 * 1000; // + 8 horas
  return { startDate, endDate, filterByField: 'dateBcvFees' };
}

/**
 * Fuente ÚNICA y Principal: AlCambio.app (GraphQL API)
 * Extrae Dólar BCV, Euro BCV y USDT Promedio (Binance P2P).
 * Emplea dateSearch para obtener la tasa activa oficial (evitando adelantos de días no bancarios).
 */
export async function fetchAlCambioRates(): Promise<{ usd: number; eur: number; usdt: number; date: string } | null> {
  try {
    const query = `
      query getRates($countryCode: String!, $dateSearch: DateSearchInput) {
        getCountryConversions(payload: { countryCode: $countryCode }, dateSearch: $dateSearch) {
          dateBcv
          conversionRates {
            type
            official
            baseValue
            rateCurrency {
              code
            }
          }
        }
        getBinanceP2PAverages {
          sellAverage
          buyAverage
        }
      }
    `;

    const dateSearch = getAlCambioDateSearch();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://api.alcambio.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          countryCode: 'VE',
          dateSearch
        }
      }),
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    let rates = json.data?.getCountryConversions?.conversionRates || [];
    const binance = json.data?.getBinanceP2PAverages;

    // Respaldo por si dateSearch retornara vacío
    if (rates.length === 0) {
      const fallbackQuery = `
        query {
          getCountryConversions(payload: { countryCode: "VE" }) {
            conversionRates {
              type
              official
              baseValue
              rateCurrency { code }
            }
          }
        }
      `;
      const fallbackRes = await fetch('https://api.alcambio.app/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fallbackQuery }),
        cache: 'no-store'
      });
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        rates = fallbackJson.data?.getCountryConversions?.conversionRates || [];
      }
    }

    // 1. Tasa USD oficial (con baseValue > 1 y official === true)
    const usdOfficial = rates.find(
      (r: any) => r?.rateCurrency?.code === 'USD' && r?.official === true && Number(r?.baseValue) > 1
    ) || rates.filter((r: any) => r?.rateCurrency?.code === 'USD' && Number(r?.baseValue) > 1).pop();
    const usd = usdOfficial ? Number(usdOfficial.baseValue) : null;

    // 2. Tasa EUR oficial
    const eurOfficial = rates.find(
      (r: any) => r?.rateCurrency?.code === 'EUR' && r?.official === true && Number(r?.baseValue) > 1
    ) || rates.find((r: any) => r?.rateCurrency?.code === 'EUR' && Number(r?.baseValue) > 1);
    const eur = eurOfficial ? Number(eurOfficial.baseValue) : null;

    // 3. Tasa USDT Promedio (Binance P2P)
    let usdt = 960.00;
    if (binance?.buyAverage && binance?.sellAverage) {
      const buy = Number(binance.buyAverage);
      const sell = Number(binance.sellAverage);
      usdt = Number(((buy + sell) / 2).toFixed(4));
    }

    if (!usd || !eur || usd <= 0 || eur <= 0) return null;

    // Fecha actual en hora de Venezuela (America/Caracas, UTC-4)
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Caracas', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const date = formatter.format(new Date());

    return {
      usd: Number(usd.toFixed(4)),
      eur: Number(eur.toFixed(4)),
      usdt,
      date
    };
  } catch (err) {
    console.error('Error al consultar AlCambio.app:', err);
    return null;
  }
}

/**
 * Sincroniza las tasas oficiales y USDT Promedio usando AlCambio.app como fuente ÚNICA.
 * En caso de falla, no consulta proveedores alternos y reporta error para contingencia manual.
 */
export async function syncRates(): Promise<{ success: boolean; result?: ExchangeRateResult; error?: string }> {
  const rates = await fetchAlCambioRates();

  if (!rates) {
    return { 
      success: false, 
      error: 'No se pudo conectar con AlCambio.app. Por favor, realiza la carga manual de contingencia en el formulario inferior.' 
    };
  }

  const { usd, eur, usdt: usdtVal, date } = rates;
  const source = 'alcambio';
  const supabase = getServiceSupabase();

  // 1. Guardar en exchange_rate_history
  const rows = [
    { date_rate: date, currency: 'USD', rate: usd, usdt_promedio: usdtVal, source },
    { date_rate: date, currency: 'EUR', rate: eur, usdt_promedio: usdtVal, source }
  ];

  let { error: upsertError } = await supabase
    .from('exchange_rate_history')
    .upsert(rows, { onConflict: 'date_rate,currency' });

  if (upsertError && upsertError.message?.includes('usdt_promedio')) {
    const fallbackRows = [
      { date_rate: date, currency: 'USD', rate: usd, source },
      { date_rate: date, currency: 'EUR', rate: eur, source }
    ];
    const retry = await supabase
      .from('exchange_rate_history')
      .upsert(fallbackRows, { onConflict: 'date_rate,currency' });
    upsertError = retry.error;
  }

  if (upsertError) {
    console.error('Error al guardar en exchange_rate_history:', upsertError);
  }

  // 2. Actualizar club_settings para caché de alta velocidad
  let { error: settingsError } = await supabase
    .from('club_settings')
    .update({
      last_bcv_usd: usd,
      last_bcv_eur: eur,
      usdt_promedio: usdtVal,
      last_usdt_promedio: usdtVal,
      bcv_updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  if (settingsError && settingsError.message?.includes('usdt_promedio')) {
    await supabase
      .from('club_settings')
      .update({
        last_bcv_usd: usd,
        last_bcv_eur: eur,
        bcv_updated_at: new Date().toISOString()
      })
      .eq('id', 1);
  }

  return {
    success: true,
    result: {
      usd,
      eur,
      usdt: usdtVal,
      usdt_promedio: usdtVal,
      date,
      source,
      updated_at: new Date().toISOString()
    }
  };
}

/**
 * Guarda manualmente una tasa oficial para una fecha determinada (contingencia administrativa).
 */
export async function saveManualRate(
  dateRate: string,
  usdRate: number,
  eurRate: number,
  usdtRate?: number
): Promise<{ success: boolean; error?: string }> {
  if (!dateRate || !usdRate || !eurRate || usdRate <= 0 || eurRate <= 0) {
    return { success: false, error: 'Datos de tasa o fecha inválidos.' };
  }

  const supabase = getServiceSupabase();
  const usdtVal = usdtRate && usdtRate > 0 ? usdtRate : undefined;

  const rows = [
    { date_rate: dateRate, currency: 'USD', rate: usdRate, usdt_promedio: usdtVal, source: 'manual' },
    { date_rate: dateRate, currency: 'EUR', rate: eurRate, usdt_promedio: usdtVal, source: 'manual' }
  ];

  let { error: upsertError } = await supabase
    .from('exchange_rate_history')
    .upsert(rows, { onConflict: 'date_rate,currency' });

  if (upsertError && upsertError.message?.includes('usdt_promedio')) {
    const fallbackRows = [
      { date_rate: dateRate, currency: 'USD', rate: usdRate, source: 'manual' },
      { date_rate: dateRate, currency: 'EUR', rate: eurRate, source: 'manual' }
    ];
    const retry = await supabase
      .from('exchange_rate_history')
      .upsert(fallbackRows, { onConflict: 'date_rate,currency' });
    upsertError = retry.error;
  }

  if (upsertError) {
    return { success: false, error: upsertError.message };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (dateRate >= todayStr) {
    const updateData: Record<string, any> = {
      last_bcv_usd: usdRate,
      last_bcv_eur: eurRate,
      bcv_updated_at: new Date().toISOString()
    };
    if (usdtVal) {
      updateData.usdt_promedio = usdtVal;
      updateData.last_usdt_promedio = usdtVal;
    }
    const { error: settingsError } = await supabase
      .from('club_settings')
      .update(updateData)
      .eq('id', 1);

    if (settingsError && settingsError.message?.includes('usdt_promedio')) {
      delete updateData.usdt_promedio;
      delete updateData.last_usdt_promedio;
      await supabase
        .from('club_settings')
        .update(updateData)
        .eq('id', 1);
    }
  }

  return { success: true };
}

/**
 * Obtiene la tasa oficial vigente (directo desde BD para 0 latencia).
 * Consulta la tasa oficial más reciente según la Fecha Valor del BCV (date_rate).
 */
export async function getTodayRates(): Promise<ExchangeRateResult> {
  const todayStr = new Date().toISOString().split('T')[0];
  const supabase = getServiceSupabase();

  // 1. Consultar el registro más reciente en exchange_rate_history (ordenado por Fecha Valor)
  const { data: latestRates } = await supabase
    .from('exchange_rate_history')
    .select('date_rate, currency, rate, usdt_promedio, source, created_at')
    .order('date_rate', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6);

  // 2. Respaldo en club_settings
  const { data: settings } = await supabase
    .from('club_settings')
    .select('last_bcv_usd, last_bcv_eur, usdt_promedio, last_usdt_promedio, bcv_updated_at')
    .eq('id', 1)
    .single();

  const fallbackUsdt = settings?.usdt_promedio 
    ? Number(settings.usdt_promedio) 
    : (settings?.last_usdt_promedio ? Number(settings.last_usdt_promedio) : 960.00);

  if (latestRates && latestRates.length > 0) {
    const latestDate = latestRates[0].date_rate;
    const usdRow = latestRates.find((r) => r.currency === 'USD' && r.date_rate === latestDate);
    const eurRow = latestRates.find((r) => r.currency === 'EUR' && r.date_rate === latestDate);
    const usdtVal = latestRates[0].usdt_promedio ? Number(latestRates[0].usdt_promedio) : fallbackUsdt;

    if (usdRow && eurRow) {
      return {
        usd: Number(usdRow.rate),
        eur: Number(eurRow.rate),
        usdt: usdtVal,
        usdt_promedio: usdtVal,
        date: latestDate,
        source: (usdRow.source as ExchangeRateResult['source']) || 'bcv',
        updated_at: usdRow.created_at
      };
    }
  }

  return {
    usd: settings?.last_bcv_usd ? Number(settings.last_bcv_usd) : 842.2067,
    eur: settings?.last_bcv_eur ? Number(settings.last_bcv_eur) : 977.8778,
    usdt: fallbackUsdt,
    usdt_promedio: fallbackUsdt,
    date: settings?.bcv_updated_at ? settings.bcv_updated_at.split('T')[0] : todayStr,
    source: 'settings',
    updated_at: settings?.bcv_updated_at || undefined
  };
}

/**
 * Obtiene el histórico reciente de tasas para administración.
 */
export async function getExchangeRatesHistory(limit = 40): Promise<RateHistoryItem[]> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('exchange_rate_history')
    .select('*')
    .order('date_rate', { ascending: false })
    .order('currency', { ascending: true })
    .limit(limit);

  return (data as RateHistoryItem[]) || [];
}

