import { getServiceSupabase } from '@/lib/supabase';
import https from 'https';

export interface ExchangeRateResult {
  usd: number;
  eur: number;
  date: string; // YYYY-MM-DD
  source: 'bcv' | 'dolarapi' | 'manual' | 'settings';
  updated_at?: string;
}

export interface RateHistoryItem {
  id: string;
  date_rate: string;
  currency: 'USD' | 'EUR';
  rate: number;
  source: string;
  created_at: string;
}

/**
 * Capa 1: Scrapping directo de https://www.bcv.org.ve/
 */
export async function scrapeBcvRates(): Promise<{ usd: number; eur: number } | null> {
  return new Promise((resolve) => {
    try {
      const req = https.get(
        'https://www.bcv.org.ve/',
        {
          rejectUnauthorized: false,
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9',
          }
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            resolve(null);
            return;
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const dolarMatch = data.match(/id="dolar"[\s\S]*?<strong[^>]*>\s*([\d,\.]+)\s*<\/strong>/i);
              const euroMatch = data.match(/id="euro"[\s\S]*?<strong[^>]*>\s*([\d,\.]+)\s*<\/strong>/i);

              if (dolarMatch && euroMatch) {
                const usd = parseFloat(dolarMatch[1].replace(/\./g, '').replace(',', '.'));
                const eur = parseFloat(euroMatch[1].replace(/\./g, '').replace(',', '.'));

                if (!isNaN(usd) && usd > 0 && !isNaN(eur) && eur > 0) {
                  resolve({ usd, eur });
                  return;
                }
              }
              resolve(null);
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.on('error', () => {
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Capa 2: Fallback a API confiable (DolarApi Venezuela)
 */
export async function fetchDolarApiRates(): Promise<{ usd: number; eur: number } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [usdRes, eurRes] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/dolares/oficial', { 
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => null),
      fetch('https://ve.dolarapi.com/v1/euros/oficial', { 
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => null)
    ]);

    clearTimeout(timeoutId);

    if (!usdRes || !usdRes.ok || !eurRes || !eurRes.ok) {
      return null;
    }

    const usdData = await usdRes.json();
    const eurData = await eurRes.json();

    const usd = Number(usdData?.promedio);
    const eur = Number(eurData?.promedio);

    if (!isNaN(usd) && usd > 0 && !isNaN(eur) && eur > 0) {
      return { usd, eur };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sincroniza las tasas oficiales (BCV -> Fallback DolarApi)
 * y persiste en exchange_rate_history y club_settings.
 */
export async function syncRates(): Promise<{ success: boolean; result?: ExchangeRateResult; error?: string }> {
  const todayStr = new Date().toISOString().split('T')[0];
  let usd = 0;
  let eur = 0;
  let source: 'bcv' | 'dolarapi' = 'bcv';

  // 1. Intentar Scrapping BCV
  const bcvResult = await scrapeBcvRates();
  if (bcvResult) {
    usd = bcvResult.usd;
    eur = bcvResult.eur;
    source = 'bcv';
  } else {
    // 2. Intentar Fallback DolarApi
    const apiResult = await fetchDolarApiRates();
    if (apiResult) {
      usd = apiResult.usd;
      eur = apiResult.eur;
      source = 'dolarapi';
    } else {
      return { 
        success: false, 
        error: 'No se pudo conectar con el Banco Central de Venezuela ni con el servicio de contingencia.' 
      };
    }
  }

  const supabase = getServiceSupabase();

  // 3. Upsert en exchange_rate_history (USD y EUR)
  const rows = [
    { date_rate: todayStr, currency: 'USD', rate: usd, source },
    { date_rate: todayStr, currency: 'EUR', rate: eur, source }
  ];

  const { error: upsertError } = await supabase
    .from('exchange_rate_history')
    .upsert(rows, { onConflict: 'date_rate,currency' });

  if (upsertError) {
    console.error('Error al guardar en exchange_rate_history:', upsertError);
  }

  // 4. Actualizar club_settings para caché de alta velocidad
  await supabase
    .from('club_settings')
    .update({
      last_bcv_usd: usd,
      last_bcv_eur: eur,
      bcv_updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  return {
    success: true,
    result: {
      usd,
      eur,
      date: todayStr,
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
  eurRate: number
): Promise<{ success: boolean; error?: string }> {
  if (!dateRate || !usdRate || !eurRate || usdRate <= 0 || eurRate <= 0) {
    return { success: false, error: 'Datos de tasa o fecha inválidos.' };
  }

  const supabase = getServiceSupabase();
  const rows = [
    { date_rate: dateRate, currency: 'USD', rate: usdRate, source: 'manual' },
    { date_rate: dateRate, currency: 'EUR', rate: eurRate, source: 'manual' }
  ];

  const { error } = await supabase
    .from('exchange_rate_history')
    .upsert(rows, { onConflict: 'date_rate,currency' });

  if (error) {
    return { success: false, error: error.message };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (dateRate === todayStr) {
    await supabase
      .from('club_settings')
      .update({
        last_bcv_usd: usdRate,
        last_bcv_eur: eurRate,
        bcv_updated_at: new Date().toISOString()
      })
      .eq('id', 1);
  }

  return { success: true };
}

/**
 * Obtiene la tasa oficial vigente para el día de hoy (directo desde BD para 0 latencia).
 */
export async function getTodayRates(): Promise<ExchangeRateResult> {
  const todayStr = new Date().toISOString().split('T')[0];
  const supabase = getServiceSupabase();

  // 1. Consultar exchange_rate_history de hoy
  const { data: todayRates } = await supabase
    .from('exchange_rate_history')
    .select('currency, rate, source, created_at')
    .eq('date_rate', todayStr);

  if (todayRates && todayRates.length >= 2) {
    const usdRow = todayRates.find((r) => r.currency === 'USD');
    const eurRow = todayRates.find((r) => r.currency === 'EUR');

    if (usdRow && eurRow) {
      return {
        usd: Number(usdRow.rate),
        eur: Number(eurRow.rate),
        date: todayStr,
        source: (usdRow.source as any) || 'bcv',
        updated_at: usdRow.created_at
      };
    }
  }

  // 2. Si no hay registro de hoy, consultar el último registro histórico disponible
  const { data: latestRates } = await supabase
    .from('exchange_rate_history')
    .select('date_rate, currency, rate, source, created_at')
    .order('date_rate', { ascending: false })
    .limit(4);

  if (latestRates && latestRates.length > 0) {
    const latestDate = latestRates[0].date_rate;
    const usdRow = latestRates.find((r) => r.currency === 'USD' && r.date_rate === latestDate);
    const eurRow = latestRates.find((r) => r.currency === 'EUR' && r.date_rate === latestDate);

    if (usdRow && eurRow) {
      return {
        usd: Number(usdRow.rate),
        eur: Number(eurRow.rate),
        date: latestDate,
        source: (usdRow.source as any) || 'bcv',
        updated_at: usdRow.created_at
      };
    }
  }

  // 3. Respaldo en club_settings
  const { data: settings } = await supabase
    .from('club_settings')
    .select('last_bcv_usd, last_bcv_eur, bcv_updated_at')
    .eq('id', 1)
    .single();

  return {
    usd: settings?.last_bcv_usd ? Number(settings.last_bcv_usd) : 842.2067,
    eur: settings?.last_bcv_eur ? Number(settings.last_bcv_eur) : 977.8778,
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
