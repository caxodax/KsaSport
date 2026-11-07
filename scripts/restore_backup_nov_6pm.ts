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
  console.log('--- REVERSANDO A PUNTO DE GUARDADO: backup 1 noviembre 6pm ---');

  const jsonPath = 'data/backups/backup_1_noviembre_6pm.json';
  if (!fs.existsSync(jsonPath)) {
    throw new Error('No se encontró el archivo de backup: ' + jsonPath);
  }

  const backupData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const athletes = backupData.athletes || [];
  console.log(`Restaurando ${athletes.length} atletas...`);

  let updated = 0;
  for (const a of athletes) {
    const { error } = await supabase
      .from('athletes')
      .update({
        status: a.status,
        paid_until: a.paid_until,
        has_alliance: a.has_alliance
      })
      .eq('id', a.id);

    if (error) {
      console.error(`Error restaurando atleta ${a.name} (${a.id}):`, error.message);
    } else {
      updated++;
    }
  }

  console.log(`Restauración completada: ${updated} de ${athletes.length} atletas restauradas.`);
}

main().catch(err => {
  console.error('Error restaurando backup:', err);
  process.exit(1);
});
