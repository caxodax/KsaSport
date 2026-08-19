import { getServiceSupabase } from '@/lib/supabase';
import { Users, AlertCircle, CircleDollarSign } from 'lucide-react';
import DashboardFilters from './DashboardFilters';
import Pagination from './Pagination';

export const revalidate = 0; // Fetch dynamic data on every request

export default async function DashboardPage({
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

  // Consulta de Atletas con Filtros y Paginación
  let athletesQuery = supabase
    .from('athletes')
    .select('id, name, cedula, status, team_id, teams!inner(id, name, category)', { count: 'exact' });

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

  // Datos para los selectores de filtros
  const { data: teamsData } = await supabase.from('teams').select('id, name').order('name');
  const { data: categoriesData } = await supabase.from('categories').select('name').order('name');
  
  if (error) {
    console.error('Error fetching athletes:', error);
  }

  // Calculate metrics
  const solventes = athletes?.filter(a => a.status === 'Solvente').length || 0;
  const morosos = athletes?.filter(a => a.status === 'Moroso').length || 0;
  const total = athletes?.length || 0;

  return (
    <div className="p-4 sm:p-8">
      {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
          <p className="text-gray-500 mt-1">Resumen financiero y estatus de atletas en tiempo real.</p>
        </div>

        {/* Metrics Widgets */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Solventes</dt>
                    <dd className="text-2xl font-bold text-gray-900">{solventes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Morosidad Activa</dt>
                    <dd className="text-2xl font-bold text-gray-900">{morosos}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-400"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total en Roster</dt>
                    <dd className="text-2xl font-bold text-gray-900">{count || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatus de Atletas */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">Estatus de Atletas</h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {count || 0} Resultados
            </span>
          </div>

          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
             <DashboardFilters 
                teams={teamsData || []} 
                categories={categoriesData || []} 
             />
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="md:hidden flex flex-col p-3 gap-3 bg-gray-50/30">
            {athletes && athletes.length > 0 ? (
              athletes.map((athlete) => (
                <div key={athlete.id} className={`bg-white p-3.5 rounded-lg shadow-sm border-l-4 ${athlete.status === 'Solvente' ? 'border-green-500' : athlete.status === 'Moroso' ? 'border-red-500' : 'border-gray-400'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">{athlete.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{athlete.cedula}</p>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {/* @ts-ignore */}
                          {athlete.teams?.name || 'Sin equipo'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border
                      ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                        athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {athlete.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Sin Atletas</p>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (Tabla Ampliada) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Atleta</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th scope="col" className="px-8 py-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Estatus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {athletes && athletes.length > 0 ? (
                  athletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-base font-bold text-gray-900">{athlete.name}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-medium">{athlete.cedula}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {/* @ts-ignore */}
                          {athlete.teams?.name ? <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">{athlete.teams.name}</span> : 'Sin equipo'}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-sm font-bold rounded-full border shadow-sm
                          ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                            athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {athlete.status === 'Solvente' && <span className="w-2 h-2 rounded-full bg-green-500 mr-2 self-center"></span>}
                          {athlete.status === 'Moroso' && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 self-center"></span>}
                          {athlete.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <Users className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">No hay resultados</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Intenta ajustar los filtros de búsqueda.
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
          />
        )}
    </div>
  );
}
