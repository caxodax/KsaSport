import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL']!, env['SUPABASE_SERVICE_ROLE_KEY']!);

async function main() {
  console.log('--- Creando punto de guardado: backup 1 noviembre 6pm ---');

  const { data: athletes, error: errAthletes } = await supabase
    .from('athletes')
    .select('*')
    .order('name');

  if (errAthletes) throw errAthletes;

  const { data: exemptions, error: errExemptions } = await supabase
    .from('athlete_exemptions')
    .select('*');

  if (errExemptions) throw errExemptions;

  const backupData = {
    tag: 'backup 1 noviembre 6pm',
    createdAtUtc: new Date().toISOString(),
    createdAtVzla: '2026-11-07 18:46:00',
    totalAthletes: athletes.length,
    totalExemptions: exemptions.length,
    athletes,
    exemptions
  };

  if (!fs.existsSync('data/backups')) {
    fs.mkdirSync('data/backups', { recursive: true });
  }

  const jsonPath = 'data/backups/backup_1_noviembre_6pm.json';
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log('JSON guardado en:', jsonPath, `(${athletes.length} atletas, ${exemptions.length} exoneraciones)`);

  let sqlContent = '-- ==============================================================================\n';
  sqlContent += '-- PUNTO DE GUARDADO: backup 1 noviembre 6pm\n';
  sqlContent += '-- Creado: ' + new Date().toISOString() + ' (Hora Oficial de Venezuela UTC-4)\n';
  sqlContent += '-- Total Atletas: ' + athletes.length + '\n';
  sqlContent += '-- ==============================================================================\n\n';

  for (const a of athletes) {
    const pUntil = a.paid_until ? "'" + a.paid_until + "'" : 'NULL';
    const alliance = a.has_alliance ? 'true' : 'false';
    const status = a.status ? "'" + a.status + "'" : "'Solvente'";
    sqlContent += 'UPDATE athletes SET status = ' + status + ', paid_until = ' + pUntil + ', has_alliance = ' + alliance + " WHERE id = '" + a.id + "';\n";
  }

  const sqlPath = 'data/backups/restore_backup_1_noviembre_6pm.sql';
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  console.log('Script SQL guardado en:', sqlPath);
}

main().catch(err => {
  console.error('Error al crear backup:', err);
  process.exit(1);
});
