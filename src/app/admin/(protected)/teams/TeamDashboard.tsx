'use client'

import { useState, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, Table as TableIcon, Shield, Users, 
  Edit3, Trash2, Filter, ChevronRight, Layers
} from 'lucide-react';
import { deleteTeam } from './actions';
import TeamDrawer from './TeamDrawer';

interface TeamData {
  id: string;
  name: string;
  category: string;
  logo_url?: string | null;
  created_at?: string;
}

interface CategoryOption {
  id?: string;
  name: string;
}

export default function TeamDashboard({
  initialTeams,
  categories = [],
  athletesCountMap = {}
}: {
  initialTeams: TeamData[];
  categories: CategoryOption[];
  athletesCountMap?: Record<string, number>;
}) {
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);

  // Filtrado reactivo (Búsqueda + Categoría)
  const filteredTeams = useMemo(() => {
    return initialTeams.filter(team => {
      const matchSearch = !search.trim() || team.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategoryFilter || team.category === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [initialTeams, search, selectedCategoryFilter]);

  // Generador de iniciales si no tiene logo
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenCreate = () => {
    setSelectedTeam(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (team: TeamData) => {
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (team: TeamData) => {
    const count = athletesCountMap[team.id] || 0;
    const msg = count > 0
      ? `Atención: "${team.name}" tiene ${count} atleta(s) asignados en el roster. ¿Seguro que deseas eliminar este equipo?`
      : `¿Seguro que deseas eliminar el equipo "${team.name}"?`;

    if (confirm(msg)) {
      await deleteTeam(team.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN DE CABECERA Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-100">
              Roster y Competición
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Gestión de Equipos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Crea y administra los equipos de la academia y sus disciplinas asignadas.
          </p>
        </div>

        {/* Botón CTA Primario (Abre el Drawer) */}
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-kasa-vinotinto via-red-900 to-red-950 hover:from-red-900 hover:to-black text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTRO DE DISCIPLINA Y TOGGLE DE VISTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
        
        {/* Controles de Búsqueda y Filtro */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
          
          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipo..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Borrar
              </button>
            )}
          </div>

          {/* Filtro desplegable por Categoría / Disciplina */}
          <div className="relative w-full sm:w-60">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-all appearance-none cursor-pointer font-medium"
            >
              <option value="">Todas las disciplinas</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Contador y Toggle de Vista */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0">
          <span className="text-xs text-gray-500 font-semibold">
            {filteredTeams.length} {filteredTeams.length === 1 ? 'equipo' : 'equipos'}
          </span>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista de Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. VISTA PRINCIPAL: TARJETAS (GRID) O TABLA EJECUTIVA */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No se encontraron equipos</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1">
            {search || selectedCategoryFilter 
              ? 'Ningún equipo coincide con los filtros aplicados. Intenta restablecer la búsqueda.' 
              : 'Aún no hay equipos registrados. Comienza creando el primero.'}
          </p>
          {(!search && !selectedCategoryFilter) && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-5 py-2.5 bg-kasa-vinotinto text-white text-xs font-bold rounded-xl hover:bg-red-900 transition-colors"
            >
              + Crear Equipo
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (

        /* === VISTA TARJETAS 360° (FIRST-MOBILE) === */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const athletesCount = athletesCountMap[team.id] || 0;

            return (
              <div 
                key={team.id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-red-100"
              >
                <div>
                  {/* Header de Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Logo del Equipo */}
                      <div className="w-14 h-14 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={team.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-kasa-vinotinto font-black text-sm tracking-wider">
                            {getInitials(team.name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-gray-900 truncate group-hover:text-kasa-vinotinto transition-colors">
                          {team.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-kasa-vinotinto border border-red-100 mt-1">
                          {team.category}
                        </span>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(team)}
                        className="p-2 text-gray-400 hover:text-kasa-vinotinto hover:bg-red-50 rounded-xl transition-colors"
                        title="Editar equipo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(team)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detalle deportivo: Nómina de atletas */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-kasa-dorado" />
                      <span className="text-xs font-bold">Atletas en Nómina</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 bg-white px-3 py-1 rounded-xl border border-gray-200/80 shadow-sm">
                      {athletesCount} {athletesCount === 1 ? 'atleta' : 'atletas'}
                    </span>
                  </div>
                </div>

                {/* Footer de Tarjeta */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-400">
                    ID: {team.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => handleOpenEdit(team)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-kasa-vinotinto hover:text-red-950 transition-colors"
                  >
                    Gestionar Equipo
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
                    Equipo
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Disciplina / Categoría
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nómina
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTeams.map((team) => {
                  const athletesCount = athletesCountMap[team.id] || 0;

                  return (
                    <tr key={team.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm">
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-kasa-vinotinto font-black text-xs">
                                {getInitials(team.name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{team.name}</p>
                            <p className="text-[11px] text-gray-400">ID: {team.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-kasa-vinotinto border border-red-100">
                          {team.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {athletesCount} {athletesCount === 1 ? 'atleta' : 'atletas'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(team)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Editar equipo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(team)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar equipo"
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

      {/* 4. DRAWER LATERAL (CREAR / EDITAR) */}
      <TeamDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        team={selectedTeam}
        categories={categories}
      />

    </div>
  );
}
