/**
 * Script de reversión de respaldo de pagos.
 * Restaura exactamente el método original de cada registro según el archivo de respaldo.
 */
const fs = require('fs');
const path = require('path');

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const env = fs.readFileSync(envFile, 'utf8');
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key);

async function rollback(backupFile) {
  if (!backupFile) {
    const backupDir = 'data/backups';
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('payments_backup_')).sort().reverse();
    if (!files.length) {
      console.error('No se encontraron archivos de respaldo en', backupDir);
      process.exit(1);
    }
    backupFile = path.join(backupDir, files[0]);
  }

  console.log(`Cargando respaldo desde: ${backupFile}`);
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log(`Reversando ${data.length} registros a sus métodos originales...`);
  let updatedCount = 0;

  for (const row of data) {
    const { error } = await admin
      .from('payments')
      .update({ method: row.method })
      .eq('id', row.id);
    if (error) {
      console.error(`Error restaurando registro ID ${row.id}:`, error.message);
    } else {
      updatedCount++;
    }
  }

  console.log(`Rollback completado con éxito: ${updatedCount}/${data.length} registros restaurados a su estado original.`);
}

const targetFile = process.argv[2];
rollback(targetFile);
