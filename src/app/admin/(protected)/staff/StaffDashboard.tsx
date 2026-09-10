'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, Table as TableIcon, Shield, Award, 
  UserCheck, Activity, Briefcase, HeartHandshake, Phone, 
  MessageCircle, Edit3, Trash2, X, Filter, Trophy, Users, Layers
} from 'lucide-react';
import { deleteStaff } from './actions';
import StaffDrawer, { StaffData, TeamOption, STAFF_ROLES } from './StaffDrawer';
import { formatCedula, cleanCedula } from '@/lib/cedula';

export default function StaffDashboard({
  initialStaff = [],
  teams = [],
  categories = []
}: {
  initialStaff: StaffData[];
  teams: TeamOption[];
  categories: string[];
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null);

  // Filtrado reactivo multidimensional
  const filteredStaff = useMemo(() => {
    return initialStaff.filter(item => {
      const q = search.trim().toLowerCase();
      const cleanQ = cleanCedula(q);
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.cedula.toLowerCase().includes(q) || 
        (cleanQ && cleanCedula(item.cedula).includes(cleanQ)) ||
        (item.phone && item.phone.includes(q));

      const matchRole = !roleFilter || item.role === roleFilter;
      const matchTeam = !teamFilter || item.team_id === teamFilter;
      const matchCategory = !categoryFilter || item.teams?.category === categoryFilter;

      return matchSearch && matchRole && matchTeam && matchCategory;
    });
  }, [initialStaff, search, roleFilter, teamFilter, categoryFilter]);

  // Generador de iniciales
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  // Helper para diseño y color de badge por rol
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Mánager':
        return {
          icon: <Award className="w-3.5 h-3.5" />,
          classes: 'bg-amber-50 text-amber-900 border-amber-200/90 ring-1 ring-amber-300/50'
        };
      case 'Entrenador':
        return {
          icon: <Shield className="w-3.5 h-3.5" />,
          classes: 'bg-rose-50 text-rose-900 border-rose-200/90 ring-1 ring-rose-300/50'
        };
      case 'Asistente Técnico':
        return {
          icon: <UserCheck className="w-3.5 h-3.5" />,
          classes: 'bg-blue-50 text-blue-900 border-blue-200/90 ring-1 ring-blue-300/50'
        };
      case 'Preparador Físico':
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          classes: 'bg-teal-50 text-teal-900 border-teal-200/90 ring-1 ring-teal-300/50'
        };
      case 'Delegado':
        return {
          icon: <Briefcase className="w-3.5 h-3.5" />,
          classes: 'bg-purple-50 text-purple-900 border-purple-200/90 ring-1 ring-purple-300/50'
        };
      case 'Kinesiólogo':
        return {
          icon: <HeartHandshake className="w-3.5 h-3.5" />,
          classes: 'bg-emerald-50 text-emerald-900 border-emerald-200/90 ring-1 ring-emerald-300/50'
        };
      default:
        return {
          icon: <Users className="w-3.5 h-3.5" />,
          classes: 'bg-slate-50 text-slate-800 border-slate-200'
        };
    }
  };

  // Limpiador para enlaces de WhatsApp
  const getWhatsAppLink = (phone?: string | null) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/\D/g, '');
    if (!cleanNumber) return null;
    const finalNumber = cleanNumber.startsWith('0') ? `58${cleanNumber.slice(1)}` : cleanNumber;
    return `https://wa.me/${finalNumber}`;
  };

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (staff: StaffData) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (staff: StaffData) => {
    if (confirm(`¿Seguro que deseas eliminar a "${staff.name}" (${staff.role}) del staff técnico?`)) {
      await deleteStaff(staff.id);
    }
  };

  const hasActiveFilters = search || roleFilter || teamFilter || categoryFilter;

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setTeamFilter('');
    setCategoryFilter('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN DE CABECERA Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-rose-200/60 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-kasa-vinotinto" />
              Cuerpo Técnico y Oficiales
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Staff Técnico
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Directorio oficial de entrenadores, mánagers y preparadores de Kasa Sports.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black text-slate-700">
              {filteredStaff.length} {filteredStaff.length === 1 ? 'Miembro' : 'Miembros'}
            </span>
          </div>

          {/* Botón CTA Primario (Abre el Drawer lateral) */}
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-900 hover:to-kasa-vinotinto text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-kasa-vinotinto/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 text-kasa-dorado stroke-[3]" />
            <span>Registrar Staff</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE CONTROL Y FILTROS INTELIGENTES */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Campo de Búsqueda */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula o teléfono..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 outline-none transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros Desplegables */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Filtro por Rol */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-kasa-vinotinto focus:bg-white cursor-pointer transition-all"
            >
              <option value="">Todos los Roles</option>
              {STAFF_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Filtro por Equipo */}
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-kasa-vinotinto focus:bg-white cursor-pointer transition-all"
            >
              <option value="">Todos los Equipos</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>

            {/* Filtro por Categoría */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-kasa-vinotinto focus:bg-white cursor-pointer transition-all"
              >
                <option value="">Todas las Disciplinas</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Reset de filtros */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-colors border border-rose-200"
              >
                Limpiar
              </button>
            )}

            {/* Toggle Grid / Tabla */}
            <div className="ml-auto flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-kasa-vinotinto shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista en Tarjetas 360"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-kasa-vinotinto shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista en Tabla"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 3. CONTENIDO: CUADRÍCULA 360 O TABLA EJECUTIVA */}
      {filteredStaff.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">
              {hasActiveFilters ? 'No se encontraron resultados' : 'Sin personal técnico registrado'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {hasActiveFilters 
                ? 'Prueba modificando los criterios de búsqueda o limpiando los filtros seleccionados.' 
                : 'Comienza agregando al primer entrenador o mánager de Kasa Sports.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Restablecer Filtros
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-gradient-to-r from-kasa-vinotinto to-red-950 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all"
            >
              + Registrar Staff
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA GRID: TARJETAS 360 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map(staff => {
            const roleBadge = getRoleBadge(staff.role);
            const waLink = getWhatsAppLink(staff.phone);

            return (
              <div
                key={staff.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between group p-6 relative"
              >
                {/* Top Section */}
                <div className="space-y-4">
                  {/* Role Badge + Acciones */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${roleBadge.classes}`}>
                      {roleBadge.icon}
                      {staff.role}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(staff)}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-xl transition-colors"
                        title="Editar expediente"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                        title="Eliminar del staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Avatar + Info Principal */}
                  <div className="flex items-start gap-3.5 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0 ring-2 ring-slate-100">
                      {getInitials(staff.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-gray-900 group-hover:text-kasa-vinotinto transition-colors leading-snug truncate">
                        {staff.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        C.I: {formatCedula(staff.cedula)}
                      </p>

                      {/* Teléfono + WhatsApp */}
                      {staff.phone ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {staff.phone}
                          </span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg border border-emerald-200/60 transition-colors inline-flex items-center gap-1 text-[10px] font-bold"
                              title="Contactar por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-normal mt-1">
                          Sin teléfono registrado
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Equipo Asignado */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {staff.teams ? (
                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs max-w-full">
                      {staff.teams.logo_url ? (
                        <img 
                          src={staff.teams.logo_url} 
                          alt={staff.teams.name || ''} 
                          className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-slate-300"
                        />
                      ) : (
                        <Trophy className="w-3.5 h-3.5 text-kasa-dorado shrink-0" />
                      )}
                      <span className="text-xs font-black text-gray-800 truncate">
                        {staff.teams.name}
                      </span>
                      {staff.teams.category && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-l border-slate-200 pl-1.5 shrink-0">
                          {staff.teams.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                      Sin equipo asignado
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="text-xs font-bold text-kasa-vinotinto hover:text-red-900 transition-colors flex items-center gap-1"
                  >
                    <span>Expediente</span>
                    <span className="text-base leading-none">›</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA EJECUTIVA */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">Miembro</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">Cédula</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">Contacto</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">Rol Técnico</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">Equipo Asignado</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStaff.map(staff => {
                  const roleBadge = getRoleBadge(staff.role);
                  const waLink = getWhatsAppLink(staff.phone);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Miembro */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                            {getInitials(staff.name)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-900">{staff.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                        {formatCedula(staff.cedula)}
                      </td>

                      {/* Teléfono */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {staff.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-700">{staff.phone}</span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md border border-emerald-200 transition-colors"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadge.classes}`}>
                          {roleBadge.icon}
                          {staff.role}
                        </span>
                      </td>

                      {/* Equipo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {staff.teams ? (
                          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            {staff.teams.logo_url ? (
                              <img 
                                src={staff.teams.logo_url} 
                                alt="" 
                                className="w-4 h-4 rounded-full object-cover shrink-0" 
                              />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-kasa-dorado shrink-0" />
                            )}
                            <span className="text-xs font-bold text-gray-800">{staff.teams.name}</span>
                            {staff.teams.category && (
                              <span className="text-[10px] text-slate-400 font-semibold pl-1 border-l border-slate-200">
                                {staff.teams.category}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Sin asignar</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Eliminar"
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

      {/* 4. MODAL DRAWER DE CREACIÓN Y EDICIÓN */}
      <StaffDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStaff(null);
        }}
        staffMember={selectedStaff}
        teams={teams}
      />

    </div>
  );
}

