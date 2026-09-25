'use server'

import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function toggleExemption(athleteId: string, productId: string, isExempt: boolean) {
  const supabase = getServiceSupabase();
  
  if (isExempt) {
    const { error } = await supabase
      .from('athlete_exemptions')
      .insert({ athlete_id: athleteId, product_id: productId });
      
    if (error && error.code !== '23505') {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('athlete_exemptions')
      .delete()
      .match({ athlete_id: athleteId, product_id: productId });
      
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin/ledger');
  return { success: true };
}

export async function toggleAthleteAlliance(athleteId: string, hasAlliance: boolean) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('athletes')
    .update({ has_alliance: hasAlliance })
    .eq('id', athleteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin/athletes');
  return { success: true };
}

