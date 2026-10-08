'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Search, Shield, Key, Trash2, Edit3, Trophy, 
  Crown, Coins, Compass, CheckCircle2, AlertTriangle, Loader2, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import UserDrawer, { AdminUserData, AdminRoleItem } from './UserDrawer';
import { revokeAdminUser } from './actions';
import { toast } from 'sonner';

export default function UsersDashboard({
  initialUsers,
  roles,
  teams,
  currentUserId,
}: {
  initialUsers: AdminUserData[];
  roles: AdminRoleItem[];
  teams: { id: string; name: string; category?: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleUserSaved = (savedUser: AdminUserData, isEdit: boolean) => {
    if (isEdit) {
      setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
      setSuccessToast(`Usuario ${savedUser.email} actualizado exitosamente.`);
    } else {
      setUsers((prev) => [savedUser, ...prev.filter((u) => u.id !== savedUser.id)]);
      setSuccessToast(`Usuario ${savedUser.email} creado y añadido a la lista.`);
    }

    setTimeout(() => setSuccessToast(null), 4000);
    router.refresh();
  };

  // Paginación Reactiva
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtrado en memoria
  const filteredUsers = users.filter((u) => {
    const matchesQuery = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.staff?.name && u.staff.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter ? u.role_id === selectedRoleFilter : true;
    return matchesQuery && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (user: AdminUserData) => {
    setEditingUser(user);
    setDrawerOpen(true);
  };

  const handleRevoke = async (targetUser: AdminUserData) => {
    if (targetUser.id === currentUserId) {
      toast.error('Por seguridad no puedes revocar tu propio acceso administrativo.');
      return;
    }

    const confirmMsg = `¿Estás seguro de revocar el acceso administrativo de ${targetUser.email}?\n\nEl usuario ya no podrá ingresar al panel de control, pero sus registros históricos se conservarán.`;
    if (!confirm(confirmMsg)) return;

    setRevokingId(targetUser.id);
    setActionError(null);

    try {
      const res = await revokeAdminUser(targetUser.id);
      if (res?.error) {
        setActionError(res.error);
        toast.error(res.error);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        toast.success(`Acceso administrativo de ${targetUser.email} revocado.`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al revocar acceso.';
      setActionError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setRevokingId(null);
    }
  };

  // Helper para insignias de rol
  const getRoleBadge = (roleId: string, roleName?: string) => {
    const label = roleName || roleId;
    switch (roleId) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-kasa-vinotinto/10 text-kasa-vinotinto border border-kasa-vinotinto/20">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            {label}
          </span>
        );
      case 'treasurer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            {label}
          </span>
        );
      case 'coordinator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Compass className="w-3.5 h-3.5 text-purple-600" />
            {label}
          </span>
        );
      case 'coach':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Trophy className="w-3.5 h-3.5 text-blue-600" />
            {label}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-vinotinto-light/20 rounded-xl">
              <Shield className="w-7 h-7 text-kasa-vinotinto" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Usuarios y Accesos
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Control de roles y permisos para directiva, finanzas y entrenadores.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-kasa-vinotinto hover:bg-vinotinto-dark text-white rounded-xl text-sm font-bold shadow-md shadow-kasa-vinotinto/20 transition-all hover:shadow-lg active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por correo o nombre..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white text-gray-700 cursor-pointer"
          >
            <option value="">Todos los Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-gray-500 px-3 py-2 bg-gray-100 rounded-lg whitespace-nowrap">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Usuario' : 'Usuarios'}
          </span>
        </div>
      </div>

      {/* VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol en Plataforma</th>
              <th className="px-6 py-4">Equipo Asignado</th>
              <th className="px-6 py-4">Fecha de Alta</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-500">No se encontraron usuarios</p>
                  <p className="text-xs text-gray-400 mt-1">Prueba cambiando los filtros de búsqueda.</p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const isCurrentUser = u.id === currentUserId;
                const displayName = u.staff?.name || u.email.split('@')[0];
                const teamDisplay = u.staff?.teams?.name 
                  ? `${u.staff.teams.name} (${u.staff.teams.category || 'Categoría'})` 
                  : (u.role_id === 'superadmin' ? 'Acceso Global a la Academia' : 'Sin Equipo Asignado');

                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-kasa-vinotinto text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {displayName.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                            <span>{displayName}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {getRoleBadge(u.role_id, u.admin_roles?.name)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        {u.role_id === 'coach' ? (
                          <span className="flex items-center gap-1.5 text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-lg">
                            <Trophy className="w-3.5 h-3.5 text-blue-600" />
                            {teamDisplay}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium">{teamDisplay}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-kasa-vinotinto hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar rol o equipo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleRevoke(u)}
                          disabled={isCurrentUser || revokingId === u.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrentUser
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title={isCurrentUser ? 'No puedes revocar tu propio acceso' : 'Revocar acceso'}
                        >
                          {revokingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL: TARJETAS (MOBILE-FIRST) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No hay usuarios coincidentes</p>
          </div>
        ) : (
          paginatedUsers.map((u) => {
            const isCurrentUser = u.id === currentUserId;
            const displayName = u.staff?.name || u.email.split('@')[0];
            const teamDisplay = u.staff?.teams?.name 
              ? `${u.staff.teams.name} (${u.staff.teams.category || ''})` 
              : (u.role_id === 'superadmin' ? 'Acceso Global' : 'Sin Equipo');

            return (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-kasa-vinotinto text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {displayName.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md">
                            Tú
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div>
                    {getRoleBadge(u.role_id, u.admin_roles?.name)}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Equipo: </span>
                    <span className="font-semibold text-gray-800">{teamDisplay}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {formatDate(u.created_at)}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleRevoke(u)}
                    disabled={isCurrentUser || revokingId === u.id}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      isCurrentUser
                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer'
                    }`}
                  >
                    {revokingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Revocar</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN REACTIVA */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium order-2 sm:order-1 text-center sm:text-left">
            Mostrando <strong className="font-bold text-gray-900">{(safePage - 1) * pageSize + 1}</strong> a{' '}
            <strong className="font-bold text-gray-900">
              {Math.min(safePage * pageSize, filteredUsers.length)}
            </strong>{' '}
            de <strong className="font-bold text-gray-900">{filteredUsers.length}</strong> usuarios
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (
                  totalPages > 7 &&
                  pg !== 1 &&
                  pg !== totalPages &&
                  Math.abs(pg - safePage) > 1
                ) {
                  if (pg === 2 || pg === totalPages - 1) {
                    return (
                      <span key={pg} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      safePage === pg
                        ? 'bg-kasa-vinotinto text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer de Creación y Edición */}
      <UserDrawer
        key={editingUser?.id || 'new'}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editingUser={editingUser}
        roles={roles}
        teams={teams}
        onUserSaved={handleUserSaved}
      />

    </div>
  );
}

