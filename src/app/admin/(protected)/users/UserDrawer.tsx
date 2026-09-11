'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Key, Mail, User, Trophy, Loader2 } from 'lucide-react';
import { createAdminUser, updateAdminUser, resetAdminPassword } from './actions';

export interface AdminRoleItem {
  id: string;
  name: string;
  permissions?: string[];
}

export interface AdminUserData {
  id: string;
  email: string;
  role_id: string;
  created_at?: string;
  admin_roles?: {
    id: string;
    name: string;
    permissions?: string[];
  } | null;
  staff?: {
    id: string;
    name: string;
    team_id?: string | null;
    teams?: {
      id: string;
      name: string;
      category?: string;
    } | null;
  } | null;
}

export default function UserDrawer({
  isOpen,
  onClose,
  editingUser,
  roles,
  teams,
  onUserSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingUser: AdminUserData | null;
  roles: AdminRoleItem[];
  teams: { id: string; name: string; category?: string }[];
  onUserSaved?: (user: AdminUserData, isEdit: boolean) => void;
}) {
  const isEditing = !!editingUser;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('coach');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modo cambio de contraseña directo si está editando
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.staff?.name || editingUser.email.split('@')[0]);
      setEmail(editingUser.email);
      setRoleId(editingUser.role_id);
      setTeamId(editingUser.staff?.team_id || '');
      setPassword('');
      setShowPasswordReset(false);
      setPasswordSuccess(false);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRoleId(roles[0]?.id || 'coach');
      setTeamId('');
      setShowPasswordReset(false);
      setPasswordSuccess(false);
    }
    setError(null);
  }, [editingUser, roles, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('role_id', roleId);
      if (name) formData.append('name', name);
      if (teamId) formData.append('team_id', teamId);

      if (isEditing) {
        formData.append('user_id', editingUser.id);
        const res = await updateAdminUser(formData);
        if (res?.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        if (res?.user && onUserSaved) {
          onUserSaved(res.user, true);
        }
      } else {
        formData.append('email', email);
        formData.append('password', password);
        const res = await createAdminUser(formData);
        if (res?.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        if (res?.user && onUserSaved) {
          onUserSaved(res.user, false);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPassword) return;
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('user_id', editingUser.id);
      formData.append('new_password', newPassword);

      const res = await resetAdminPassword(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setPasswordSuccess(true);
        setNewPassword('');
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordReset(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-kasa-vinotinto to-vinotinto-dark text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Shield className="w-6 h-6 text-kasa-dorado" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {isEditing ? 'Editar Usuario y Rol' : 'Nuevo Usuario Administrativo'}
                </h3>
                <p className="text-xs text-white/80">
                  {isEditing ? 'Actualiza permisos o equipo asignado' : 'Asigna acceso al panel de control'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <form id="user-drawer-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-kasa-dorado" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none transition-all"
                  required
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-kasa-dorado" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditing}
                  placeholder="usuario@ksasport.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isEditing 
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto'
                  }`}
                  required
                />
                {isEditing && (
                  <p className="text-[11px] text-gray-400 mt-1">El correo electrónico no puede ser modificado una vez creado.</p>
                )}
              </div>

              {/* Contraseña Inicial (Solo al crear) */}
              {!isEditing && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-kasa-dorado" />
                    Contraseña Inicial
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none transition-all"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">El usuario podrá iniciar sesión de inmediato con esta clave.</p>
                </div>
              )}

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-kasa-dorado" />
                  Rol Administrativo
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none transition-all font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-gray-500">
                  {roleId === 'superadmin' && '👑 Acceso total a finanzas, libro mayor, atletas, catálogo y configuración.'}
                  {roleId === 'treasurer' && '💰 Acceso a panel de finanzas, pagos, libro mayor y consulta de atletas.'}
                  {roleId === 'coordinator' && '📋 Acceso a atletas, alineación, equipos, categorías, staff y catálogo.'}
                  {roleId === 'coach' && '⚾ Acceso limitado al Roster y Alineación de su equipo asignado.'}
                </div>
              </div>

              {/* Selector de Equipo (Condicional si es Coach o Staff) */}
              {roleId === 'coach' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-blue-600" />
                    Equipo que Dirige
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-gray-800"
                    required={roleId === 'coach'}
                  >
                    <option value="">Seleccionar Equipo...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.category ? `(${t.category})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-700 leading-tight">
                    El entrenador solo verá los atletas de este equipo en su Roster y en su tablero de Alineación.
                  </p>
                </div>
              )}

            </form>

            {/* Sección Separada: Restablecer Contraseña (Si está editando) */}
            {isEditing && (
              <div className="pt-4 border-t border-gray-100">
                {!showPasswordReset ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-kasa-vinotinto hover:text-vinotinto-dark transition-colors py-1"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>¿Deseas cambiar la contraseña de este usuario?</span>
                  </button>
                ) : (
                  <form onSubmit={handleResetPassword} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-kasa-dorado" />
                        Nueva Contraseña
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(false)}
                        className="text-[11px] text-gray-400 hover:text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                      required
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={loading || !newPassword}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Cambiando...' : 'Guardar Nueva Clave'}
                      </button>
                      {passwordSuccess && (
                        <span className="text-xs font-bold text-green-600">¡Clave actualizada!</span>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/70 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="user-drawer-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-kasa-vinotinto hover:bg-vinotinto-dark text-white rounded-xl text-xs font-bold shadow-md shadow-kasa-vinotinto/20 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

