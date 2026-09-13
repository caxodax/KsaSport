#!/usr/bin/env node
/**
 * ==============================================================================
 * SCRIPT AUTÓNOMO DE EXTRACCIÓN DE TASAS - ALCAMBIO.APP
 * ==============================================================================
 * Extrae:
 *  - Tasa USD (Oficial BCV)
 *  - Tasa EUR (Oficial BCV)
 *  - Tasa USDT Promedio (Binance P2P)
 * Almacena en:
 *  - data/rates_history.json
 *  - data/rates_history.csv
 *
 * Parámetros opcionales:
 *  --sync    Sincroniza directamente con la base de datos Supabase de KsaSport.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const JSON_FILE = path.join(DATA_DIR, 'rates_history.json');
const CSV_FILE = path.join(DATA_DIR, 'rates_history.csv');

async function fetchFromAlCambio() {
  const query = `
    query {
      getCountryConversions(payload: { countryCode: "VE" }) {
        _id
        dateBcv
        conversionRates {
          rateCurrency {
            code
            name
          }
          baseValue
          rateValue
          official
          principal
        }
      }
      getBinanceP2PAverages {
        sellAverage
        buyAverage
        effectiveFrom
        updatedAt
      }
    }
  `;

  const response = await fetch('https://api.alcambio.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`HTTP error al consultar AlCambio.app: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Error GraphQL en AlCambio.app: ${json.errors.map(e => e.message).join(', ')}`);
  }

  const data = json.data;
  const rates = data?.getCountryConversions?.conversionRates || [];
  const binance = data?.getBinanceP2PAverages;

  // 1. Extraer Tasa Oficial USD BCV (el registro official === true con baseValue mayor o más reciente)
  const usdOfficial = rates
    .filter(r => r?.rateCurrency?.code === 'USD' && r?.official === true && r?.baseValue > 1)
    .pop();
  const usdRate = usdOfficial ? Number(usdOfficial.baseValue) : null;

  // 2. Extraer Tasa Oficial EUR BCV
  const eurOfficial = rates.find(r => r?.rateCurrency?.code === 'EUR' && r?.official === true);
  const eurRate = eurOfficial ? Number(eurOfficial.baseValue) : null;

  // 3. Extraer Tasa USDT Promedio (Binance P2P)
  let usdtPromedio = null;
  if (binance?.buyAverage && binance?.sellAverage) {
    const buy = Number(binance.buyAverage);
    const sell = Number(binance.sellAverage);
    usdtPromedio = Number(((buy + sell) / 2).toFixed(4));
  }

  if (!usdRate || !eurRate || !usdtPromedio) {
    throw new Error('No se pudieron extraer todos los indicadores requeridos de AlCambio.app.');
  }

  return {
    usd: Number(usdRate.toFixed(4)),
    eur: Number(eurRate.toFixed(4)),
    usdt: usdtPromedio
  };
}

function getCaracasTimestamp() {
  const now = new Date();
  const options = { timeZone: 'America/Caracas', hour12: false };
  
  const formatter = new Intl.DateTimeFormat('es-VE', {
    ...options,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const getPart = type => parts.find(p => p.type === type)?.value || '';

  const fecha = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const hora = `${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

  return { fecha, hora };
}

function saveToJson(record) {
  let list = [];
  if (fs.existsSync(JSON_FILE)) {
    try {
      const raw = fs.readFileSync(JSON_FILE, 'utf8');
      list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }

  list.push(record);
  fs.writeFileSync(JSON_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function saveToCsv(record) {
  const header = 'Fecha_Consulta,Hora_Consulta,Tasa_USD,Tasa_EUR,Tasa_USDT_Promedio,Fuente\n';
  const row = `${record.Fecha_Consulta},${record.Hora_Consulta},${record.Tasa_USD.toFixed(4)},${record.Tasa_EUR.toFixed(4)},${record.Tasa_USDT_Promedio.toFixed(4)},${record.Fuente}\n`;

  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, header + row, 'utf8');
  } else {
    fs.appendFileSync(CSV_FILE, row, 'utf8');
  }
}

async function syncToSupabase(record) {
  try {
    // Cargar variables de entorno si existe .env.local
    const envFile = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = match[2] || '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        }
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn('⚠️  Aviso: Variables de Supabase no encontradas en .env.local. Se omite sincronización a BD.');
      return;
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const dateStr = record.Fecha_Consulta;

    // 1. Guardar en exchange_rate_history
    const rows = [
      { date_rate: dateStr, currency: 'USD', rate: record.Tasa_USD, usdt_promedio: record.Tasa_USDT_Promedio, source: 'alcambio' },
      { date_rate: dateStr, currency: 'EUR', rate: record.Tasa_EUR, usdt_promedio: record.Tasa_USDT_Promedio, source: 'alcambio' }
    ];

    let { error: upsertError } = await supabase
      .from('exchange_rate_history')
      .upsert(rows, { onConflict: 'date_rate,currency' });

    if (upsertError && upsertError.message?.includes('usdt_promedio')) {
      // Reintentar sin usdt_promedio si el usuario no ha corrido la migración SQL
      const fallbackRows = [
        { date_rate: dateStr, currency: 'USD', rate: record.Tasa_USD, source: 'alcambio' },
        { date_rate: dateStr, currency: 'EUR', rate: record.Tasa_EUR, source: 'alcambio' }
      ];
      const retry = await supabase
        .from('exchange_rate_history')
        .upsert(fallbackRows, { onConflict: 'date_rate,currency' });
      upsertError = retry.error;
      console.warn('⚠️  Nota: Ejecuta "migration_usdt_promedio.sql" en Supabase para habilitar la columna usdt_promedio.');
    }

    if (upsertError) {
      console.error('❌ Error al actualizar exchange_rate_history:', upsertError.message);
    } else {
      console.log('✅ exchange_rate_history actualizado en Supabase.');
    }

    // 2. Guardar en club_settings
    let { error: settingsError } = await supabase
      .from('club_settings')
      .update({
        last_bcv_usd: record.Tasa_USD,
        last_bcv_eur: record.Tasa_EUR,
        usdt_promedio: record.Tasa_USDT_Promedio,
        last_usdt_promedio: record.Tasa_USDT_Promedio,
        bcv_updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (settingsError && settingsError.message?.includes('usdt_promedio')) {
      const retrySettings = await supabase
        .from('club_settings')
        .update({
          last_bcv_usd: record.Tasa_USD,
          last_bcv_eur: record.Tasa_EUR,
          bcv_updated_at: new Date().toISOString()
        })
        .eq('id', 1);
      settingsError = retrySettings.error;
    }

    if (settingsError) {
      console.error('❌ Error al actualizar club_settings:', settingsError.message);
    } else {
      console.log('✅ club_settings actualizado en Supabase.');
    }
  } catch (err) {
    console.error('⚠️  Fallo al conectar con Supabase:', err.message);
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Iniciando extracción de tasas desde https://alcambio.app');
  console.log('====================================================');

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const rates = await fetchFromAlCambio();
    const { fecha, hora } = getCaracasTimestamp();

    const record = {
      Fecha_Consulta: fecha,
      Hora_Consulta: hora,
      Tasa_USD: rates.usd,
      Tasa_EUR: rates.eur,
      Tasa_USDT_Promedio: rates.usdt,
      Fuente: 'alcambio.app'
    };

    console.log(`📅 Fecha Consulta: ${record.Fecha_Consulta}`);
    console.log(`⏰ Hora Consulta:  ${record.Hora_Consulta} (VET)`);
    console.log(`💵 Tasa USD (BCV): Bs. ${record.Tasa_USD.toFixed(4)}`);
    console.log(`💶 Tasa EUR (BCV): Bs. ${record.Tasa_EUR.toFixed(4)}`);
    console.log(`🟢 USDT Promedio:  Bs. ${record.Tasa_USDT_Promedio.toFixed(4)}`);

    saveToJson(record);
    saveToCsv(record);
    console.log(`💾 Registros guardados en:`);
    console.log(`   - ${JSON_FILE}`);
    console.log(`   - ${CSV_FILE}`);

    if (process.argv.includes('--sync')) {
      console.log('\n🔄 Sincronizando con base de datos KsaSport...');
      await syncToSupabase(record);
    }

    console.log('\n✨ Proceso finalizado con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR EN LA EXTRACCIÓN:', err.message);
    console.error('⚠️  Acción requerida: Carga manual por parte del administrador en el panel /admin/rates.');
    process.exit(1);
  }
}

main();
