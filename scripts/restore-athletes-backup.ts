import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL']!, env['SUPABASE_SERVICE_ROLE_KEY']!);

async function restore() {
  const backupFile = path.join(process.cwd(), 'data', 'backups', 'athletes_backup_latest.json');
  if (!fs.existsSync(backupFile)) {
    console.error('No se encontró archivo de respaldo latest.');
    process.exit(1);
  }

  const athletes = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`Restaurando ${athletes.length} atletas desde ${backupFile}...`);

  let restored = 0;
  for (const a of athletes) {
    const { error } = await supabase
      .from('athletes')
      .update({ status: a.status, paid_until: a.paid_until })
      .eq('id', a.id);

    if (error) {
      console.error(`Error restaurando a ${a.name}:`, error.message);
    } else {
      restored++;
    }
  }

  console.log(`✅ Restauración finalizada. ${restored}/${athletes.length} atletas restauradas.`);
}

restore();
