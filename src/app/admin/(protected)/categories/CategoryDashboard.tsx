'use client'

import { useState, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, Table as TableIcon, Trophy, Users, Shield, 
  Activity, Edit3, Trash2, Layers, Zap, Eye, ChevronRight
} from 'lucide-react';
import { deleteCategory } from './actions';
import CategoryDrawer from './CategoryDrawer';
import PositionsModal from './PositionsModal';
import { PositionItem, normalizePositions } from '@/lib/positions';

interface CategoryData {
  id: string;
  name: string;
  positions?: any;
  created_at?: string;
}

export default function CategoryDashboard({
  initialCategories,
  teamsCountMap = {},
  athletesCountMap = {}
}: {
  initialCategories: CategoryData[];
  teamsCountMap?: Record<string, number>;
  athletesCountMap?: Record<string, number>;
}) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Drawer y Modales
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  
  const [inspectPositionsData, setInspectPositionsData] = useState<{
    name: string;
    positions: PositionItem[];
  } | null>(null);

  // Filtrado reactivo
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return initialCategories;
    const q = search.toLowerCase();
    return initialCategories.filter(cat => {
      const nameMatch = cat.name.toLowerCase().includes(q);
      const positions = normalizePositions(cat.positions);
      const posMatch = positions.some(p => 
        p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
      return nameMatch || posMatch;
    });
  }, [initialCategories, search]);

  // Totales para KPIs
  const totalDisciplines = initialCategories.length;
  const totalTeams = Object.values(teamsCountMap).reduce((a, b) => a + b, 0);
  const totalAthletes = Object.values(athletesCountMap).reduce((a, b) => a + b, 0);
  const totalPositions = useMemo(() => {
    return initialCategories.reduce((acc, cat) => {
      return acc + normalizePositions(cat.positions).length;
    }, 0);
  }, [initialCategories]);

  // Helper para asignar icono deportivo representativo
  const getSportIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('kickingball') || n.includes('beisbol') || n.includes('softbol')) {
      return <Trophy className="w-6 h-6 text-amber-600" />;
    }
    if (n.includes('futbol') || n.includes('fútbol') || n.includes('futsal')) {
      return <Shield className="w-6 h-6 text-kasa-vinotinto" />;
    }
    if (n.includes('voleibol') || n.includes('voley')) {
      return <Zap className="w-6 h-6 text-orange-600" />;
    }
    return <Layers className="w-6 h-6 text-indigo-600" />;
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category: CategoryData) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (cat: CategoryData) => {
    const countTeams = teamsCountMap[cat.name] || 0;
    const promptMessage = countTeams > 0
      ? `Atención: Hay ${countTeams} equipo(s) vinculados a "${cat.name}". ¿Seguro que deseas eliminarla?`
      : `¿Seguro que deseas eliminar la disciplina "${cat.name}"?`;

    if (confirm(promptMessage)) {
      await deleteCategory(cat.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN DE CABECERA Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-100">
              Gestión Deportiva
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Disciplinas y Categorías
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Configura las disciplinas de la academia, sus equipos asociados y el catálogo táctico de posiciones.
          </p>
        </div>

        {/* Botón CTA Primario (Abre el Drawer) */}
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-kasa-vinotinto via-red-900 to-red-950 hover:from-red-900 hover:to-black text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Disciplina</span>
        </button>
      </div>

      {/* 2. BARRA DE MÉTRICAS / KPIS EJECUTIVOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-kasa-vinotinto rounded-2xl shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Disciplinas</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{totalDisciplines}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Equipos Registrados</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{totalTeams}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Atletas en Sistema</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{totalAthletes}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Posiciones Tácticas</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{totalPositions}</p>
          </div>
        </div>

      </div>

      {/* 3. BARRA DE HERRAMIENTAS: BÚSQUEDA Y SELECTOR DE VISTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
        
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por disciplina o posición..."
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

        {/* Controles de vista (Toggle Grid / Table) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <span className="text-xs text-gray-500 font-semibold">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'resultado' : 'disciplinas'}
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

      {/* 4. VISTA PRINCIPAL: TARJETAS (GRID) O TABLA EJECUTIVA */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No se encontraron disciplinas</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1">
            {search ? `Ninguna categoría coincide con "${search}". Prueba con otro término.` : 'Aún no hay disciplinas configuradas. Comienza registrando la primera.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-5 py-2.5 bg-kasa-vinotinto text-white text-xs font-bold rounded-xl hover:bg-red-900 transition-colors"
            >
              + Crear Disciplina
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* === VISTA TARJETAS 360° (FIRST-MOBILE) === */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const positions = normalizePositions(cat.positions);
            const teamsCount = teamsCountMap[cat.name] || 0;
            const athletesCount = athletesCountMap[cat.name] || 0;
            const previewPositions = positions.slice(0, 4);
            const remainingCount = positions.length - previewPositions.length;

            return (
              <div 
                key={cat.id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-red-100"
              >
                <div>
                  {/* Header de Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        {getSportIcon(cat.name)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-kasa-vinotinto transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] font-bold text-gray-400">
                          {positions.length > 0 ? `${positions.length} posiciones tácticas` : 'Sin posiciones'}
                        </span>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 text-gray-400 hover:text-kasa-vinotinto hover:bg-red-50 rounded-xl transition-colors"
                        title="Editar disciplina"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar disciplina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Estadísticas de la disciplina */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Equipos</p>
                      <p className="text-base font-black text-gray-900">{teamsCount}</p>
                    </div>
                    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Atletas Activos</p>
                      <p className="text-base font-black text-gray-900">{athletesCount}</p>
                    </div>
                  </div>

                  {/* Previsualización de Posiciones */}
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Posiciones en Cancha:
                    </p>
                    {positions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {previewPositions.map((pos) => (
                          <span
                            key={pos.code}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-bold font-mono border border-gray-200"
                            title={pos.name}
                          >
                            {pos.code}
                          </span>
                        ))}

                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectPositionsData({ name: cat.name, positions })}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 text-kasa-vinotinto text-[11px] font-black border border-red-200 transition-colors"
                          >
                            +{remainingCount} más
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No aplica posiciones tácticas</span>
                    )}
                  </div>
                </div>

                {/* Footer de Tarjeta */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-400">
                    ID: {cat.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-kasa-vinotinto hover:text-red-950"
                  >
                    Gestionar
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
                    Disciplina
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Equipos
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Atletas
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Posiciones Configuradas
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredCategories.map((cat) => {
                  const positions = normalizePositions(cat.positions);
                  const teamsCount = teamsCountMap[cat.name] || 0;
                  const athletesCount = athletesCountMap[cat.name] || 0;
                  const previewPositions = positions.slice(0, 5);
                  const remainingCount = positions.length - previewPositions.length;

                  return (
                    <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                            {getSportIcon(cat.name)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{cat.name}</p>
                            <p className="text-[11px] text-gray-400">ID: {cat.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {teamsCount} equipos
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {athletesCount} atletas
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {positions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center max-w-md">
                            {previewPositions.map((p) => (
                              <span
                                key={p.code}
                                className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200"
                                title={p.name}
                              >
                                {p.code}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setInspectPositionsData({ name: cat.name, positions })}
                                className="text-[11px] font-bold text-kasa-vinotinto bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full border border-red-200"
                              >
                                +{remainingCount} más
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No aplica</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Editar disciplina"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar disciplina"
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

      {/* 5. DRAWER LATERAL (CREAR / EDITAR) */}
      <CategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        category={selectedCategory}
      />

      {/* 6. MODAL VISOR DE TODAS LAS POSICIONES */}
      <PositionsModal
        isOpen={Boolean(inspectPositionsData)}
        onClose={() => setInspectPositionsData(null)}
        categoryName={inspectPositionsData?.name || ''}
        positions={inspectPositionsData?.positions || []}
      />

    </div>
  );
}

