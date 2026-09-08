'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Search, LayoutGrid, Table as TableIcon, Users, User, 
  Edit3, Trash2, Filter, ChevronRight, UserSearch, Phone, Award, Shield
} from 'lucide-react';
import { deleteAthlete } from './actions';
import AthleteDrawer from './AthleteDrawer';
import Pagination from '../Pagination';

interface TeamItem {
  id: string;
  name: string;
  category: string;
}

interface CategoryItem {
  id?: string;
  name: string;
  positions?: any;
}

interface AthleteData {
  id: string;
  name: string;
  cedula: string;
  phone?: string | null;
  status: string;
  team_id?: string | null;
  position?: string | null;
  stats_avg?: number | null;
  stats_hits?: number | null;
  stats_rbi?: number | null;
  stats_runs?: number | null;
  paid_until?: string | null;
  has_alliance?: boolean;
  avatar_url?: string | null;
  teams?: { id: string; name: string; category?: string } | null;
}

export default function AthleteDashboard({
  initialAthletes,
  teams = [],
  categories = [],
  isSuperAdmin = true,
  coachTeamId = null,
  totalCount = 0,
  totalPages = 0,
  currentPage = 1,
  resolvedParams = {}
}: {
  initialAthletes: AthleteData[];
  teams: TeamItem[];
  categories: CategoryItem[];
  isSuperAdmin?: boolean;
  coachTeamId?: string | null;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  resolvedParams?: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de filtros desde URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get('team') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

  // Vista (Tarjetas vs Tabla)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);

  // Sincronizar filtros con la URL
  const applyFilters = (newParams: { query?: string; team?: string; category?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newParams.query !== undefined) {
      if (newParams.query) params.set('query', newParams.query);
      else params.delete('query');
    }
    if (newParams.team !== undefined) {
      if (newParams.team) params.set('team', newParams.team);
      else params.delete('team');
    }
    if (newParams.category !== undefined) {
      if (newParams.category) params.set('category', newParams.category);
      else params.delete('category');
    }
    if (newParams.status !== undefined) {
      if (newParams.status) params.set('status', newParams.status);
      else params.delete('status');
    }

    params.set('page', '1'); // Reiniciar a página 1 al filtrar
    router.push(`/admin/athletes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ query: searchQuery.trim() });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    applyFilters({ query: '' });
  };

  const handleTeamChange = (val: string) => {
    setSelectedTeam(val);
    applyFilters({ team: val });
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    applyFilters({ category: val });
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    applyFilters({ status: val });
  };

  const handleOpenCreate = () => {
    setSelectedAthlete(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (athlete: AthleteData) => {
    setSelectedAthlete(athlete);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (athlete: AthleteData) => {
    if (confirm(`¿Seguro que deseas eliminar a la atleta "${athlete.name}" (C.I. ${athlete.cedula})?`)) {
      await deleteAthlete(athlete.id);
    }
  };

  // Helper de iniciales para avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CABECERA LIMPIA Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-100">
              Roster y Fichas
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Roster de Atletas
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Registra y gestiona las deportistas, solvencia y expediente de la academia.
          </p>
        </div>

        {/* Botón CTA Primario (Abre el Drawer) */}
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-kasa-vinotinto via-red-900 to-red-950 hover:from-red-900 hover:to-black text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Atleta</span>
        </button>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA EN TIEMPO REAL, FILTROS Y TOGGLE */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Buscador por Nombre o Cédula */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o cédula..."
              className="w-full pl-9 pr-14 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm text-gray-900 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all"
            />
            {searchQuery ? (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Borrar
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 font-bold absolute right-3 top-1/2 -translate-y-1/2">
                ↵ Enter
              </span>
            )}
          </form>

          {/* Filtros Dropdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto flex-1 lg:max-w-2xl">
            {/* Filtro Equipo */}
            {!coachTeamId && (
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all font-medium cursor-pointer"
              >
                <option value="">Todos los equipos</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro Disciplina */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all font-medium cursor-pointer"
            >
              <option value="">Todas las disciplinas</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filtro Estatus */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all font-medium cursor-pointer"
            >
              <option value="">Todos los estatus</option>
              <option value="Solvente">🟢 Solventes</option>
              <option value="Moroso">🔴 Morosos</option>
              <option value="Inactivo">⚫ Inactivos</option>
            </select>
          </div>

          {/* Contador y Toggle de Vista */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <span className="text-xs text-gray-500 font-bold">
              {totalCount} {totalCount === 1 ? 'atleta' : 'atletas'}
            </span>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista de Tabla"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. VISTA PRINCIPAL: TARJETAS (GRID) O TABLA EJECUTIVA */}
      {initialAthletes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No se encontraron atletas</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1">
            Ninguna atleta coincide con los filtros aplicados. Intenta restablecer los términos de búsqueda.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-5 py-2.5 bg-kasa-vinotinto text-white text-xs font-bold rounded-xl hover:bg-red-900 transition-colors"
          >
            + Registrar Atleta
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* === VISTA TARJETAS 360° (FIRST-MOBILE) === */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {initialAthletes.map((athlete) => {
            return (
              <div 
                key={athlete.id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-red-100"
              >
                <div>
                  {/* Header de Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      
                      {/* Avatar / Iniciales */}
                      <Link 
                        href={`/admin/athletes/${athlete.id}`}
                        className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                        title="Ver Perfil 360"
                      >
                        {athlete.avatar_url ? (
                          <img src={athlete.avatar_url} alt={athlete.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-black text-xs text-kasa-vinotinto tracking-wider">
                            {getInitials(athlete.name)}
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link 
                          href={`/admin/athletes/${athlete.id}`}
                          className="text-base font-black text-gray-900 hover:text-kasa-vinotinto transition-colors truncate block"
                          title="Ver Perfil 360"
                        >
                          {athlete.name}
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-gray-500">
                            C.I. {athlete.cedula}
                          </span>
                          {athlete.has_alliance && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-kasa-dorado/10 text-kasa-dorado border border-kasa-dorado/20">
                              🤝 Alianza
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isSuperAdmin && (
                        <Link
                          href={`/admin/athletes/${athlete.id}`}
                          className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                          title="Ver Perfil 360"
                        >
                          <UserSearch className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleOpenEdit(athlete)}
                        className="p-2 text-gray-400 hover:text-kasa-vinotinto hover:bg-red-50 rounded-xl transition-colors"
                        title="Editar ficha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(athlete)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar atleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Asignación Deportiva */}
                  <div className="mt-4 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Equipo Asignado</p>
                      <p className="text-xs font-black text-gray-900 truncate">
                        {athlete.teams?.name || 'Sin equipo'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Posición</p>
                      {athlete.position ? (
                        <span className="font-mono text-xs font-black text-kasa-vinotinto bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-xs">
                          {athlete.position}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Estatus Financiero y Fecha */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${
                      athlete.status === 'Solvente' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : athlete.status === 'Moroso'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {athlete.status === 'Solvente' ? '🟢 Solvente' : athlete.status === 'Moroso' ? '🔴 Moroso' : '⚫ Inactivo'}
                    </span>

                    {athlete.paid_until && (
                      <span className="text-[11px] font-medium text-gray-500">
                        {athlete.status === 'Solvente' ? 'Hasta' : 'Desde'}: {new Date(athlete.paid_until).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>

                  {/* Estadísticas de Rendimiento si están cargadas */}
                  {(athlete.stats_avg != null || athlete.stats_hits != null) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs font-bold">
                      {athlete.stats_avg != null && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                          AVG: {athlete.stats_avg}
                        </span>
                      )}
                      {athlete.stats_hits != null && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                          HITS: {athlete.stats_hits}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer de Tarjeta */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {athlete.phone ? (
                    <a 
                      href={`tel:${athlete.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900"
                    >
                      <Phone className="w-3 h-3" />
                      {athlete.phone}
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-300">Sin teléfono</span>
                  )}

                  <Link
                    href={`/admin/athletes/${athlete.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-kasa-vinotinto hover:text-red-950 transition-colors"
                  >
                    Ver Expediente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* === VISTA TABLA EJECUTIVA (STYLE STRIPE/LINEAR) === */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/50">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Atleta
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Equipo y Disciplina
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estatus Financiero
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {initialAthletes.map((athlete) => {
                  return (
                    <tr key={athlete.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/admin/athletes/${athlete.id}`}
                            className="w-9 h-9 rounded-xl overflow-hidden bg-red-50 border border-red-100 flex items-center justify-center shrink-0"
                          >
                            {athlete.avatar_url ? (
                              <img src={athlete.avatar_url} alt={athlete.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-xs text-kasa-vinotinto">
                                {getInitials(athlete.name)}
                              </span>
                            )}
                          </Link>
                          <div>
                            <Link 
                              href={`/admin/athletes/${athlete.id}`}
                              className="text-sm font-black text-gray-900 hover:text-kasa-vinotinto transition-colors block"
                            >
                              {athlete.name}
                            </Link>
                            <span className="text-[11px] text-gray-400">
                              C.I. {athlete.cedula} {athlete.has_alliance && '• 🤝 Alianza'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-900 block">
                          {athlete.teams?.name || 'Sin equipo'}
                        </span>
                        {athlete.teams?.category && (
                          <span className="text-[10px] text-gray-400">
                            {athlete.teams.category}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {athlete.position ? (
                          <span className="font-mono text-xs font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {athlete.position}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-max ${
                            athlete.status === 'Solvente' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : athlete.status === 'Moroso'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {athlete.status}
                          </span>
                          {athlete.paid_until && (
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Hasta: {new Date(athlete.paid_until).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          {isSuperAdmin && (
                            <Link
                              href={`/admin/athletes/${athlete.id}`}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Ver Perfil 360"
                            >
                              <UserSearch className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleOpenEdit(athlete)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar ficha"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(athlete)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar atleta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PAGINACIÓN */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={resolvedParams as Record<string, string>}
          basePath="/admin/athletes"
        />
      )}

      {/* 5. DRAWER LATERAL (CREAR / EDITAR) */}
      <AthleteDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        athlete={selectedAthlete}
        teams={teams}
        categories={categories}
        isSuperAdmin={isSuperAdmin}
        coachTeamId={coachTeamId}
      />

    </div>
  );
}
