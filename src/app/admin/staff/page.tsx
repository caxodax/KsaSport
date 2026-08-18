import { getServiceSupabase } from '@/lib/supabase';
import { Shield, Plus } from 'lucide-react';
import DashboardFilters from '../DashboardFilters';
import Pagination from '../Pagination';
import { createStaff } from './actions';
import StaffRow, { StaffCard } from './StaffRow';

export const revalidate = 0;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = getServiceSupabase();
  const resolvedParams = await searchParams;

  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : '';
  const teamFilter = typeof resolvedParams.team === 'string' ? resolvedParams.team : '';
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const roleFilter = typeof resolvedParams.role === 'string' ? resolvedParams.role : '';
  
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: teamsData } = await supabase.from('teams').select('id, name, category').order('name');
  const { data: categoriesData } = await supabase.from('categories').select('name').order('name');

  let staffQuery = supabase
    .from('staff')
    .select('id, name, cedula, phone, role, team_id, teams!left(id, name, category)', { count: 'exact' });

  if (query) {
    staffQuery = staffQuery.or(`name.ilike.%${query}%,cedula.ilike.%${query}%`);
  }
  if (teamFilter) {
    staffQuery = staffQuery.eq('team_id', teamFilter);
  }
  if (categoryFilter) {
    // Si buscamos por categoría, tenemos que forzar a que tenga equipo, por eso en este caso particular filtramos usando la relación.
    staffQuery = staffQuery.eq('teams.category', categoryFilter).not('team_id', 'is', null);
  }
  if (roleFilter) {
    staffQuery = staffQuery.eq('role', roleFilter);
  }

  const { data: staffMembers, error, count } = await staffQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  const roles = ["Mánager", "Entrenador", "Asistente Técnico", "Preparador Físico", "Delegado", "Kinesiólogo"];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Staff Técnico</h2>
        <p className="text-gray-500 mt-1">Directorio de entrenadores y personal de Kasa Sports.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        <DashboardFilters 
          teams={teamsData || []} 
          categories={categoriesData || []} 
          basePath="/admin/staff"
          hideStatus={true}
          showRole={true}
        />

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="w-5 h-5 text-kasa-vinotinto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Registrar Personal Técnico</h3>
          </div>
          
          <form action={createStaff} className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="Ej: Juan Silva"
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
                placeholder="Ej: 15123456"
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
            <div className="w-full md:w-40">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rol / Cargo *</label>
              <select 
                id="role" 
                name="role" 
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">Equipo (Opcional)</label>
              <select 
                id="team_id" 
                name="team_id" 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
              >
                <option value="">Sin equipo asignado</option>
                {teamsData?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-kasa-gris flex items-center gap-2">
              <Shield className="w-6 h-6 text-kasa-dorado" />
              Personal Registrado
            </h3>
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {count || 0} Resultados
            </span>
          </div>

          <div className="md:hidden flex flex-col p-3 gap-3 bg-gray-50/30">
            {staffMembers && staffMembers.length > 0 ? (
              staffMembers.map((sm) => (
                <StaffCard key={sm.id} staffMember={sm} teams={teamsData || []} />
              ))
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl">
                <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">Sin Staff</h3>
                <p className="text-sm text-gray-500 mt-1">Registra al primer miembro del staff.</p>
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {staffMembers && staffMembers.length > 0 ? (
                  staffMembers.map((sm) => (
                    <StaffRow key={sm.id} staffMember={sm} teams={teamsData || []} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <Shield className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Sin Resultados</h3>
                      <p className="mt-1 text-base text-gray-500">
                        Aún no hay personal registrado que coincida con la búsqueda.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {totalPages > 1 && (
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            searchParams={resolvedParams as Record<string, string>} 
            basePath="/admin/staff"
          />
        )}
      </div>
    </div>
  );
}
