'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { cleanCedula } from '@/lib/cedula';

export async function createAthlete(formData: FormData) {
  const name = formData.get('name') as string;
  const cedula = cleanCedula(formData.get('cedula') as string);
  const phone = formData.get('phone') as string;
  const team_id = formData.get('team_id') as string;
  const status = formData.get('status') as string || 'Solvente';
  const paid_until = formData.get('paid_until') as string || null;
  const has_alliance = formData.get('has_alliance') === 'on' || formData.get('has_alliance') === 'true';

  if (!name || !cedula) return { error: 'Nombre y cédula son requeridos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').insert([{ 
    name, 
    cedula, 
    phone, 
    team_id: team_id || null, 
    status,
    paid_until,
    position: formData.get('position') as string || null,
    stats_avg: formData.get('stats_avg') ? Number(formData.get('stats_avg')) : null,
    stats_hits: formData.get('stats_hits') ? Number(formData.get('stats_hits')) : null,
    stats_rbi: formData.get('stats_rbi') ? Number(formData.get('stats_rbi')) : null,
    stats_runs: formData.get('stats_runs') ? Number(formData.get('stats_runs')) : null,
    has_alliance
  }]);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un atleta con esa cédula' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/athletes');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteAthlete(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/athletes');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateAthlete(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const cedula = cleanCedula(formData.get('cedula') as string);
  const phone = formData.get('phone') as string;
  const team_id = formData.get('team_id') as string;
  const status = formData.get('status') as string;
  const paid_until = formData.get('paid_until') as string || null;
  const has_alliance = formData.get('has_alliance') === 'on' || formData.get('has_alliance') === 'true';

  if (!id || !name || !cedula) return { error: 'Datos incompletos' };

  const supabase = getServiceSupabase();
  
  // Construir el objeto a actualizar
  const updateData: any = { 
    name, 
    cedula, 
    phone, 
    team_id: team_id || null
  };
  
  // Solo actualizar el status si viene en el form (para evitar que coaches lo pisen con null)
  if (status) updateData.status = status;
  if (formData.has('paid_until')) updateData.paid_until = paid_until;
  if (formData.has('position')) updateData.position = formData.get('position') as string;
  if (formData.has('stats_avg')) updateData.stats_avg = formData.get('stats_avg') ? Number(formData.get('stats_avg')) : null;
  if (formData.has('stats_hits')) updateData.stats_hits = formData.get('stats_hits') ? Number(formData.get('stats_hits')) : null;
  if (formData.has('stats_rbi')) updateData.stats_rbi = formData.get('stats_rbi') ? Number(formData.get('stats_rbi')) : null;
  if (formData.has('stats_runs')) updateData.stats_runs = formData.get('stats_runs') ? Number(formData.get('stats_runs')) : null;
  if (formData.has('has_alliance')) updateData.has_alliance = has_alliance;

  const { error } = await supabase.from('athletes').update(updateData).eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe otro atleta con esa cédula' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/athletes');
  revalidatePath('/admin');
  return { success: true };
}

export async function getAthletesForExport(filters: {
  query?: string;
  teamId?: string;
  category?: string;
  status?: string;
}) {
  const supabase = getServiceSupabase();

  const selectQuery = filters.category
    ? 'id, name, cedula, phone, status, team_id, position, paid_until, has_alliance, user_id, created_at, teams!inner(id, name, category)'
    : 'id, name, cedula, phone, status, team_id, position, paid_until, has_alliance, user_id, created_at, teams(id, name, category)';

  let q = supabase
    .from('athletes')
    .select(selectQuery)
    .order('name', { ascending: true });

  if (filters.teamId) {
    q = q.eq('team_id', filters.teamId);
  }

  if (filters.category) {
    q = q.eq('teams.category', filters.category);
  }

  if (filters.status) {
    q = q.eq('status', filters.status);
  }

  if (filters.query) {
    const cleanQ = cleanCedula(filters.query);
    if (cleanQ && cleanQ !== filters.query) {
      q = q.or(`name.ilike.%${filters.query}%,cedula.ilike.%${cleanQ}%,cedula.ilike.%${filters.query}%`);
    } else {
      q = q.or(`name.ilike.%${filters.query}%,cedula.ilike.%${filters.query}%`);
    }
  }

  const { data, error } = await q;

  if (error) {
    console.error('Error fetching athletes for export:', error);
    return { error: error.message, athletes: [] };
  }

  return { athletes: data || [] };
}

