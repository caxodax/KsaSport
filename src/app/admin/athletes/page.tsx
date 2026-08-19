import { getServiceSupabase } from '@/lib/supabase';
import { Users, Plus } from 'lucide-react';
import DashboardFilters from '../DashboardFilters';
import Pagination from '../Pagination';
import { createAthlete } from './actions';
import AthleteRow, { AthleteCard } from './AthleteRow';

export const revalidate = 0;

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = getServiceSupabase();
  const resolvedParams = await searchParams;

  // Extraer parámetros de búsqueda
  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : '';
  const teamFilter = typeof resolvedParams.team === 'string' ? resolvedParams.team : '';
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : '';
  
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Datos para los selectores de filtros y el formulario
  const { data: teamsData } = await supabase.from('teams').select('id, name, category').order('name');
  const { data: categoriesData } = await supabase.from('categories').select('name').order('name');

  // Consulta de Atletas con Filtros y Paginación
  let athletesQuery = supabase
    .from('athletes')
    .select('id, name, cedula, phone, status, team_id, teams!inner(id, name, category)', { count: 'exact' });

  if (query) {
    athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${query}%`);
  }
  if (teamFilter) {
    athletesQuery = athletesQuery.eq('team_id', teamFilter);
  }
  if (categoryFilter) {
    athletesQuery = athletesQuery.eq('teams.category', categoryFilter);
  }
  if (statusFilter) {
    athletesQuery = athletesQuery.eq('status', statusFilter);
  }

  const { data: athletes, error, count } = await athletesQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Roster de Atletas</h2>
        <p className="text-gray-500 mt-1">Registra y gestiona las jugadoras de Kasa Sports.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Filtros Reutilizados (Minimalistas) */}
        <DashboardFilters 
          teams={teamsData || []} 
          categories={categoriesData || []} 
          basePath="/admin/athletes"
        />

        {/* Formulario Crear Atleta */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="w-5 h-5 text-kasa-vinotinto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Registrar Nueva Jugadora</h3>
          </div>
          
          <form action={createAthlete as any} className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="Ej: María Pérez"
              />
            </div>
            <div className="w-full md:w-32">
              <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
              <input 
                type="text" 
                id="cedula" 
                name="cedula" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="Ej: 20123456"
              />
            </div>
            <div className="w-full md:w-32">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                type="text" 
                id="phone" 
                name="phone" 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="Opcional"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select 
                id="team_id" 
                name="team_id" 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
              >
                <option value="">Seleccionar Equipo</option>
                {teamsData?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
              <select 
                id="status" 
                name="status" 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
              >
                <option value="Solvente">Solvente</option>
                <option value="Moroso">Moroso</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full md:w-auto h-[38px] text-sm"
            >
              Registrar
            </button>
          </form>
        </div>

        {/* Lista de Atletas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <Users className="w-6 h-6 text-kasa-dorado" />
              Directorio de Atletas
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {count || 0} Resultados
            </span>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-3 gap-3 bg-gray-50/30">
            {athletes && athletes.length > 0 ? (
              athletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete as any} teams={teamsData || []} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Sin Atletas</h3>
                <p className="text-sm text-gray-500 mt-1">Registra la primera jugadora.</p>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estatus</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {athletes && athletes.length > 0 ? (
                  athletes.map((athlete) => (
                    <AthleteRow key={athlete.id} athlete={athlete as any} teams={teamsData || []} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <Users className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Sin Atletas</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Aún no hay atletas registradas que coincidan con la búsqueda.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            searchParams={resolvedParams as Record<string, string>} 
            basePath="/admin/athletes"
          />
        )}
      </div>
    </div>
  );
}
