'use client';

import { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, Check, Key, Smartphone, Users, Trophy, 
  AlertCircle, Loader2, Phone, Bell, Eye, EyeOff, 
  Trash2, ShieldCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import { saveStaffAccessAndPermissions, revokeStaffAccess } from './actions';
import { formatCedula } from '@/lib/cedula';
import { toast } from 'sonner';

export interface StaffWithUserData {
  id: string;
  name: string;
  cedula: string;
  phone?: string | null;
  role: string;
  team_id?: string | null;
  user_id?: string | null;
  roleConfigured?: boolean;
  rolePermissions?: string[];
  teams?: {
    id?: string;
    name?: string;
    category?: string;
    logo_url?: string | null;
  } | null;
  user?: {
    id: string;
    email: string;
    role_id: string;
    permissions: string[];
  } | null;
}

export const AVAILABLE_PERMISSIONS = [
  {
    id: 'view_lineup',
    title: 'Pizarra de Alineación Táctica',
    description: 'Armar orden al bate, registrar posiciones defensivas y ver estadísticas de juego.',
    icon: Trophy,
    category: 'Deportivo',
    color: 'from-amber-500 to-amber-600',
    badge: 'Táctico'
  },
  {
    id: 'view_roster',
    title: 'Roster y Fichas de Atletas',
    description: 'Visualizar a las jugadoras de su equipo y su promedio de bateo (AVG).',
    icon: Users,
    category: 'Deportivo',
    color: 'from-blue-500 to-blue-600',
    badge: 'Roster'
  },
  {
    id: 'view_athlete_contact',
    title: 'Contacto Directo WhatsApp',
    description: 'Ver números de teléfono personales y botón directo para abrir chat de WhatsApp.',
    icon: Phone,
    category: 'Comunicación',
    color: 'from-emerald-500 to-emerald-600',
    badge: 'Contacto'
  },
  {
    id: 'send_notifications',
    title: 'Envío de Alertas Push',
    description: 'Redactar y disparar notificaciones push a los teléfonos de su equipo.',
    icon: Bell,
    category: 'Comunicación',
    color: 'from-purple-500 to-purple-600',
    badge: 'Push'
  },
  {
    id: 'manage_cantina',
    title: 'Punto de Consumo en Cantina',
    description: 'Permite registrar pedidos o consumos en la cantina deportiva.',
    icon: Smartphone,
    category: 'Operativo',
    color: 'from-rose-500 to-rose-600',
    badge: 'Cantina'
  }
];

export default function StaffPermissionsDrawer({
  isOpen,
  onClose,
  staffMember,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  staffMember: StaffWithUserData | null;
  onSuccess?: () => void;
}) {
  const [enableAccess, setEnableAccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar estado inicial al abrir o cambiar de staff
  useEffect(() => {
    if (staffMember) {
      const hasAccess = Boolean(staffMember.user_id || staffMember.user || staffMember.roleConfigured);
      setEnableAccess(hasAccess);
      setEmail(staffMember.user?.email || '');
      setPassword('');
      const perms = staffMember.user?.permissions?.length
        ? staffMember.user.permissions
        : (staffMember.rolePermissions?.length ? staffMember.rolePermissions : ['view_lineup', 'view_roster']);
      setSelectedPermissions(perms);
    } else {
      setEnableAccess(false);
      setEmail('');
      setPassword('');
      setSelectedPermissions(['view_lineup', 'view_roster']);
    }
    setErrorMsg(null);
  }, [staffMember, isOpen]);

  if (!isOpen || !staffMember) return null;

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const applyPreset = (preset: 'basic' | 'manager' | 'lineup_only') => {
    if (preset === 'lineup_only') {
      setSelectedPermissions(['view_lineup']);
    } else if (preset === 'basic') {
      setSelectedPermissions(['view_lineup', 'view_roster']);
    } else if (preset === 'manager') {
      setSelectedPermissions(['view_lineup', 'view_roster', 'view_athlete_contact', 'send_notifications']);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (enableAccess) {
      if (email.trim() && !email.includes('@')) {
        setErrorMsg('El correo ingresado no tiene un formato válido.');
        return;
      }
      if (password && password.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (selectedPermissions.length === 0) {
        setErrorMsg('Debes asignar al menos un permiso para que el usuario pueda interactuar con el panel.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await saveStaffAccessAndPermissions({
        staffId: staffMember.id,
        enableAccess,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        password: password ? password.trim() : undefined,
        permissions: selectedPermissions
      });

      if (res?.error) {
        setErrorMsg(res.error);
        toast.error(res.error);
      } else {
        toast.success(enableAccess ? 'Permisos y acceso actualizados correctamente' : 'Acceso deshabilitado');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los permisos.');
      toast.error('Ocurrió un error inesperado al procesar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(`¿Estás seguro de que deseas revocar el acceso web a ${staffMember.name}? Ya no podrá iniciar sesión en el panel.`)) {
      return;
    }

    setRevoking(true);
    setErrorMsg(null);

    try {
      const res = await revokeStaffAccess(staffMember.id);
      if (res?.error) {
        setErrorMsg(res.error);
        toast.error(res.error);
      } else {
        toast.success(`Acceso web revocado para ${staffMember.name}`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al revocar el acceso.');
    } finally {
      setRevoking(false);
    }
  };

  const hasActiveUser = Boolean(staffMember.user_id || staffMember.user);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out border-l border-slate-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-kasa-vinotinto text-white px-6 py-5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15">
                <ShieldCheck className="w-6 h-6 text-kasa-dorado" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Control de Acceso y Permisos
                </h2>
                <p className="text-xs text-white/70 font-medium mt-0.5">
                  Asigna lo que puede ver y hacer este miembro del staff
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tarjeta del Miembro del Staff */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                    {staffMember.role}
                  </span>
                  {staffMember.teams ? (
                    <span className="text-[10px] font-bold text-slate-500 truncate">
                      • {staffMember.teams.name} ({staffMember.teams.category || 'General'})
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">• Sin equipo asignado</span>
                  )}
                </div>
                <h3 className="text-base font-black text-gray-900 mt-1 truncate">
                  {staffMember.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  C.I. {formatCedula(staffMember.cedula)} {staffMember.phone && `• 📱 ${staffMember.phone}`}
                </p>
              </div>

              <div className="text-right shrink-0">
                {hasActiveUser ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Acceso Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-600">
                    Sin Cuenta Web
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Switch Principal: Habilitar Acceso Web */}
            <div className="border border-slate-200 rounded-2xl p-4.5 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-900">
                    Permitir inicio de sesión en el Panel
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Habilita las credenciales para que ingrese desde la web o la app.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAccess}
                    onChange={(e) => setEnableAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Información de Vinculación y Cuenta */}
              {enableAccess && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {staffMember.user ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Cuenta Vinculada
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-950 mt-1">
                            {staffMember.user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRevoke}
                        disabled={revoking}
                        className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors p-1 cursor-pointer"
                      >
                        {revoking ? 'Desvinculando...' : 'Desvincular'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          Auto-vinculación con C.I.
                        </span>
                        <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                          No necesitas asignarle correo ni clave. El técnico se registrará en la app por su cuenta e ingresará su cédula <strong>({formatCedula(staffMember.cedula)})</strong> para acceder con los permisos que marques abajo.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Asignación manual opcional (oculta por defecto) */}
                  <details className="group pt-1">
                    <summary className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1.5 select-none">
                      <Key className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                      <span>{staffMember.user ? 'Cambiar credenciales manualmente (Avanzado)' : 'Asignar credenciales manualmente (Opcional)'}</span>
                    </summary>
                    <div className="pt-3 space-y-3 pl-2 border-l-2 border-slate-100 mt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Correo Electrónico (Opcional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="entrenador@ksasport.com"
                          className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-kasa-vinotinto/30 focus:border-kasa-vinotinto outline-hidden"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600">
                            {staffMember.user ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial (Opcional)'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={staffMember.user ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                          minLength={6}
                          className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-kasa-vinotinto/30 focus:border-kasa-vinotinto outline-hidden"
                        />
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* SECCIÓN DE PERMISOS GRANULARES */}
            {enableAccess && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">
                      Módulos y Acciones Permitidas
                    </h4>
                    <p className="text-xs text-slate-500">
                      Marca exactamente lo que este técnico puede ver y hacer:
                    </p>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('lineup_only')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    Solo Pizarra
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('basic')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors"
                  >
                    Entrenador Básico
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('manager')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                  >
                    Mánager Completo
                  </button>
                </div>

                {/* Lista de Permisos con Toggles Visuales */}
                <div className="space-y-2.5">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    const Icon = perm.icon;

                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isChecked 
                            ? 'bg-slate-900/2 border-slate-900 text-gray-900 shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 bg-gradient-to-br ${perm.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-gray-900">
                              {perm.title}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isChecked ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {perm.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {perm.description}
                          </p>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-kasa-vinotinto border-kasa-vinotinto text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner de Candado Fijo / Seguridad */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-600 flex items-start gap-3">
                  <div className="p-1.5 bg-slate-200 rounded-lg text-slate-700 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-900">
                      Blindaje Financiero y Administrativo Automático
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      El cuerpo técnico tiene <strong>estrictamente bloqueados</strong> los módulos de Finanzas, Pagos, Balance Contable, Configuración del Club, Tasa BCV y Gestión de Usuarios. Solo tú como Súper Administrador tienes acceso a ellos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revocar Acceso si ya tiene usuario */}
            {hasActiveUser && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Revocar acceso definitivamente</p>
                  <p className="text-[10px] text-slate-400">Elimina el usuario y bloquea su entrada al panel</p>
                </div>
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Revocar Acceso</span>
                </button>
              </div>
            )}

          </form>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || revoking}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || revoking}
              className="px-5 py-2.5 rounded-xl bg-kasa-vinotinto hover:bg-red-900 text-white font-black text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando Permisos...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
