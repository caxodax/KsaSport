import { getServiceSupabase } from '@/lib/supabase';
import { Trophy, Plus } from 'lucide-react';
import { createTeam } from './actions';
import TeamRow, { TeamCard } from './TeamRow';

export const revalidate = 0;

export default async function TeamsPage() {
  const supabase = getServiceSupabase();
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, category, created_at')
    .order('created_at', { ascending: false });

  // Fallback silencioso por si aún no corren el script SQL
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .order('name');

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h2>
          <p className="text-gray-500 mt-1">Crea y administra las categorías y equipos de Kasa Sports.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Formulario Crear Equipo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="w-5 h-5 text-kasa-vinotinto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nuevo Equipo</h3>
          </div>
          
          <form action={createTeam as any} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto focus:border-transparent outline-none transition-all"
                placeholder="Ej: Las Fieras"
              />
            </div>
            <div className="flex-1 w-full">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                id="category" 
                name="category" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto focus:border-transparent outline-none transition-all"
              >
                <option value="">Selecciona una categoría</option>
                {categories && categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Infantil">Infantil (Fallback)</option>
                    <option value="Pre-Junior">Pre-Junior (Fallback)</option>
                    <option value="Junior">Junior (Fallback)</option>
                    <option value="Libre">Libre (Fallback)</option>
                    <option value="Master">Master (Fallback)</option>
                  </>
                )}
              </select>
            </div>
            <button 
              type="submit" 
              className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full md:w-auto h-[42px]"
            >
              Registrar
            </button>
          </form>
        </div>

        {/* Lista de Equipos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <Trophy className="w-6 h-6 text-kasa-dorado" />
              Equipos Registrados
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {teams?.length || 0} Total
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {teams && teams.length > 0 ? (
              teams.map((team) => (
                <TeamCard key={team.id} team={team} categories={categories || []} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Sin Equipos</h3>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Nombre del Equipo</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-8 py-5 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {teams && teams.length > 0 ? (
                  teams.map((team) => (
                    <TeamRow key={team.id} team={team} categories={categories || []} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center">
                      <Trophy className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Sin Equipos</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Aún no hay equipos registrados. Usa el formulario para crear uno.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
