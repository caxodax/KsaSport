import { unstable_cache } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';

export interface CachedTeam {
  id: string;
  name: string;
  category: string;
}

export interface CachedCategory {
  id: string;
  name: string;
  positions?: any;
}

/**
 * Obtiene la lista de equipos en caché de memoria del servidor durante 5 minutos (300s).
 * Reduce drásticamente las consultas a Supabase en entornos con alta concurrencia.
 */
export const getCachedTeams = unstable_cache(
  async (): Promise<CachedTeam[]> => {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, category')
      .order('name');

    if (error) {
      console.error('Error cargando equipos en caché:', error);
      return [];
    }

    return (data as CachedTeam[]) || [];
  },
  ['catalog-teams-key'],
  {
    revalidate: 300,
    tags: ['teams'],
  }
);

/**
 * Obtiene la lista de categorías / disciplinas en caché de memoria del servidor durante 5 minutos (300s).
 */
export const getCachedCategories = unstable_cache(
  async (): Promise<CachedCategory[]> => {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, positions')
      .order('name');

    if (error) {
      console.error('Error cargando categorías en caché:', error);
      return [];
    }

    return (data as CachedCategory[]) || [];
  },
  ['catalog-categories-key'],
  {
    revalidate: 300,
    tags: ['categories'],
  }
);
