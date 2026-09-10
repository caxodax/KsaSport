'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, User, Phone, IdCard, Briefcase, Trophy, AlertCircle, Loader2, Check } from 'lucide-react';
import { createStaff, updateStaff } from './actions';

export const STAFF_ROLES = [
  "Mánager",
  "Entrenador",
  "Asistente Técnico",
  "Preparador Físico",
  "Delegado",
  "Kinesiólogo"
];

export interface TeamOption {
  id: string;
  name: string;
  category: string;
  logo_url?: string | null;
}

export interface StaffData {
  id: string;
  name: string;
  cedula: string;
  phone?: string | null;
  role: string;
  team_id?: string | null;
  teams?: {
    id?: string;
    name?: string;
    category?: string;
    logo_url?: string | null;
  } | null;
}

export default function StaffDrawer({
  isOpen,
  onClose,
  staffMember = null,
  teams = [],
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffData | null;
  teams: TeamOption[];
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(staffMember);

  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(STAFF_ROLES[0]);
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (staffMember) {
      setName(staffMember.name);
      setCedula(staffMember.cedula);
      setPhone(staffMember.phone || '');
      setRole(staffMember.role || STAFF_ROLES[0]);
      setTeamId(staffMember.team_id || '');
    } else {
      setName('');
      setCedula('');
      setPhone('');
      setRole(STAFF_ROLES[0]);
      setTeamId('');
    }
    setErrorMsg(null);
  }, [staffMember, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre completo es obligatorio.');
      return;
    }
    if (!cedula.trim()) {
      setErrorMsg('La cédula de identidad es obligatoria.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (isEditing && staffMember) {
      formData.append('id', staffMember.id);
    }
    formData.append('name', name.trim());
    formData.append('cedula', cedula.trim());
    formData.append('phone', phone.trim());
    formData.append('role', role);
    formData.append('team_id', teamId);

    const res = isEditing ? await updateStaff(formData) : await createStaff(formData);

    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-kasa-vinotinto to-red-950 text-white flex items-center justify-center shadow-md shadow-kasa-vinotinto/20">
              <Shield className="w-5 h-5 text-kasa-dorado" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isEditing ? 'Expediente Técnico' : 'Nuevo Registro'}
              </span>
              <h2 className="text-xl font-black text-gray-900 leading-tight">
                {isEditing ? 'Editar Personal' : 'Registrar Staff'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="staff-form" onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2.5 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-kasa-dorado" />
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Oscar García"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 outline-none transition-all"
              required
            />
          </div>

          {/* Cédula y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-kasa-dorado" />
                Cédula <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="Ej: 28466117"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-kasa-dorado" />
                Teléfono
              </label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej: 04128505629"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Rol / Cargo */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-kasa-dorado" />
              Rol / Cargo Técnico <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_ROLES.map(r => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-gradient-to-r from-kasa-vinotinto to-red-950 text-white border-transparent shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-kasa-dorado shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asignación de Equipo */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-kasa-dorado" />
              Equipo Asignado
            </label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 outline-none transition-all cursor-pointer"
            >
              <option value="">Sin equipo asignado (Libre)</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 font-medium">
              El personal técnico tendrá visibilidad y acceso de control sobre este equipo.
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="staff-form"
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-900 hover:to-kasa-vinotinto text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg shadow-kasa-vinotinto/20 disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Staff'}</span>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
