'use server'

import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function assignPosition(athleteId: string, position: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').update({ position }).eq('id', athleteId);
  
  if (error) {
    console.error("Error assigning position:", error);
    return { error: 'No se pudo asignar la posición.' };
  }
  
  revalidatePath('/admin/lineup');
  return { success: true };
}

export async function unassignPosition(athleteId: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').update({ position: null }).eq('id', athleteId);
  
  if (error) {
    console.error("Error unassigning position:", error);
    return { error: 'No se pudo remover la posición.' };
  }
  
  revalidatePath('/admin/lineup');
  return { success: true };
}

export async function updateBattingOrder(athleteId: string, order: number | null) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').update({ batting_order: order }).eq('id', athleteId);
  
  if (error) return { error: 'No se pudo actualizar el orden al bate.' };
  revalidatePath('/admin/lineup');
  return { success: true };
}

export async function addOffensiveStat(athleteId: string, statType: 'hit' | 'out') {
  const supabase = getServiceSupabase();
  // Obtener estado actual
  const { data: athlete } = await supabase.from('athletes').select('stats_hits, stats_off_outs').eq('id', athleteId).single();
  
  if (!athlete) return { error: 'Atleta no encontrada.' };
  
  const updates: any = {};
  if (statType === 'hit') updates.stats_hits = (athlete.stats_hits || 0) + 1;
  if (statType === 'out') updates.stats_off_outs = (athlete.stats_off_outs || 0) + 1;

  const { error } = await supabase.from('athletes').update(updates).eq('id', athleteId);
  if (error) return { error: 'Error actualizando estadística.' };
  
  revalidatePath('/admin/lineup');
  return { success: true };
}

export async function addDefensiveStat(athleteId: string) {
  const supabase = getServiceSupabase();
  // Obtener estado actual
  const { data: athlete } = await supabase.from('athletes').select('stats_def_outs').eq('id', athleteId).single();
  
  if (!athlete) return { error: 'Atleta no encontrada.' };
  
  const { error } = await supabase.from('athletes').update({ stats_def_outs: (athlete.stats_def_outs || 0) + 1 }).eq('id', athleteId);
  if (error) return { error: 'Error actualizando estadística.' };
  
  revalidatePath('/admin/lineup');
  return { success: true };
}
