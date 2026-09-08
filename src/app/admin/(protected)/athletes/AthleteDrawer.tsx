'use client'

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, User, Shield, Phone, Calendar, Award, AlertCircle, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { createAthlete, updateAthlete } from './actions';
import { PositionItem, normalizePositions } from '@/lib/positions';

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

export default function AthleteDrawer({
  isOpen,
  onClose,
  athlete = null,
  teams = [],
  categories = [],
  isSuperAdmin = true,
  coachTeamId = null,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  athlete?: AthleteData | null;
  teams: TeamItem[];
  categories: CategoryItem[];
  isSuperAdmin?: boolean;
  coachTeamId?: string | null;
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(athlete);

  // Form states
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [teamId, setTeamId] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('Solvente');
  const [paidUntil, setPaidUntil] = useState('');
  const [hasAlliance, setHasAlliance] = useState(false);

  // Stats
  const [showStats, setShowStats] = useState(false);
  const [statsAvg, setStatsAvg] = useState('');
  const [statsHits, setStatsHits] = useState('');
  const [statsRbi, setStatsRbi] = useState('');
  const [statsRuns, setStatsRuns] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (athlete) {
      setName(athlete.name || '');
      setCedula(athlete.cedula || '');
      setPhone(athlete.phone || '');
      setTeamId(athlete.team_id || coachTeamId || '');
      setPosition(athlete.position || '');
      setStatus(athlete.status || 'Solvente');
      setPaidUntil(athlete.paid_until ? athlete.paid_until.split('T')[0] : '');
      setHasAlliance(athlete.has_alliance || false);

      setStatsAvg(athlete.stats_avg != null ? athlete.stats_avg.toString() : '');
      setStatsHits(athlete.stats_hits != null ? athlete.stats_hits.toString() : '');
      setStatsRbi(athlete.stats_rbi != null ? athlete.stats_rbi.toString() : '');
      setStatsRuns(athlete.stats_runs != null ? athlete.stats_runs.toString() : '');
      if (athlete.stats_avg || athlete.stats_hits || athlete.stats_rbi || athlete.stats_runs) {
        setShowStats(true);
      } else {
        setShowStats(false);
      }
    } else {
      setName('');
      setCedula('');
      setPhone('');
      setTeamId(coachTeamId || (teams[0]?.id || ''));
      setPosition('');
      setStatus('Solvente');
      
      // Default: fin de mes actual
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      setPaidUntil(endOfMonth.toISOString().split('T')[0]);
      
      setHasAlliance(false);
      setStatsAvg('');
      setStatsHits('');
      setStatsRbi('');
      setStatsRuns('');
      setShowStats(false);
    }
    setErrorMsg(null);
  }, [athlete, coachTeamId, teams, isOpen]);

  // Posiciones dinámicas según el equipo seleccionado
  const availablePositions = useMemo(() => {
    const selectedTeam = teams.find(t => t.id === teamId);
    if (!selectedTeam) return [];
    const matchedCategory = categories.find(c => c.name === selectedTeam.category);
    return normalizePositions(matchedCategory?.positions);
  }, [teamId, teams, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre completo es requerido.');
      return;
    }
    if (!cedula.trim()) {
      setErrorMsg('La cédula de identidad es requerida.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (isEditing && athlete) {
      formData.append('id', athlete.id);
    }
    formData.append('name', name.trim());
    formData.append('cedula', cedula.trim().replace(/\./g, '')); // Remover puntos para evitar duplicados
    formData.append('phone', phone.trim());
    formData.append('team_id', teamId || coachTeamId || '');
    
    if (isSuperAdmin) {
      formData.append('status', status);
      if (paidUntil) formData.append('paid_until', paidUntil);
    }
    
    formData.append('has_alliance', hasAlliance ? 'true' : 'false');
    if (position) formData.append('position', position);
    if (statsAvg) formData.append('stats_avg', statsAvg);
    if (statsHits) formData.append('stats_hits', statsHits);
    if (statsRbi) formData.append('stats_rbi', statsRbi);
    if (statsRuns) formData.append('stats_runs', statsRuns);

    const res = isEditing ? await updateAthlete(formData) : await createAthlete(formData);
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300">
          
          {/* Header del Drawer */}
          <div className="p-6 bg-gradient-to-r from-kasa-vinotinto via-red-950 to-kasa-vinotinto text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <User className="w-6 h-6 text-kasa-dorado" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/70 block">
                  {isEditing ? 'Expediente Deportivo' : 'Alta de Deportista'}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {isEditing ? 'Editar Ficha de Atleta' : 'Registrar Nueva Atleta'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario con Scroll */}
          {/* Formulario con Scroll */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
            
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 font-bold flex items-center gap-2.5 shadow-sm animate-in shake duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  1. Datos Personales
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: María Pérez"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Cédula de Identidad *
                  </label>
                  <input 
                    type="text" 
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                    placeholder="Ej: 20123456 (sin puntos)"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 0412-1234567"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: ASIGNACIÓN DEPORTIVA (DINÁMICA) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  2. Asignación Deportiva
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Equipo */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Equipo Asignado
                  </label>
                  {coachTeamId ? (
                    <input 
                      type="text" 
                      disabled 
                      value={teams.find(t => t.id === coachTeamId)?.name || 'Tu Equipo'}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-black"
                    />
                  ) : (
                    <select
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all cursor-pointer"
                    >
                      <option value="">Sin equipo asignado</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Posición dinámica */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Posición en Cancha
                  </label>
                  {availablePositions.length > 0 ? (
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all cursor-pointer"
                    >
                      <option value="">Seleccionar Posición</option>
                      {availablePositions.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                      {position && !availablePositions.some(p => p.code === position) && (
                        <option value={position}>{position} (Histórico)</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={!teamId ? 'Selecciona equipo primero' : 'No aplica posiciones'}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-100 text-slate-400 text-xs italic font-medium"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: ESTATUS FINANCIERO Y BENEFICIOS */}
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                    3. Membresía y Solvencia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Estatus Financiero
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all cursor-pointer"
                    >
                      <option value="Solvente">🟢 Solvente</option>
                      <option value="Moroso">🔴 Moroso</option>
                      <option value="Inactivo">⚫ Inactivo (Bloqueado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      {status === 'Solvente' ? 'Válido Hasta' : 'Vencimiento'}
                    </label>
                    <input 
                      type="date"
                      value={paidUntil}
                      onChange={(e) => setPaidUntil(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-kasa-vinotinto focus:border-kasa-vinotinto outline-none shadow-xs transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      checked={hasAlliance}
                      onChange={(e) => setHasAlliance(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-black text-gray-900 block">
                        🤝 Alianza Comercial / Exoneración
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Marcar si esta jugadora cuenta con beca o patrocinio institucional.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* SECCIÓN 4: ESTADÍSTICAS DEPORTIVAS (PLEGABLE) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-kasa-vinotinto" />
                  <span className="text-xs font-black text-slate-800">
                    Estadísticas de Rendimiento (Opcional)
                  </span>
                </div>
                {showStats ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">AVG</label>
                    <input 
                      type="number"
                      step="0.001"
                      value={statsAvg}
                      onChange={(e) => setStatsAvg(e.target.value)}
                      placeholder="0.000"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">HITS</label>
                    <input 
                      type="number"
                      value={statsHits}
                      onChange={(e) => setStatsHits(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">CI (RBI)</label>
                    <input 
                      type="number"
                      value={statsRbi}
                      onChange={(e) => setStatsRbi(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">CA (Runs)</label>
                    <input 
                      type="number"
                      value={statsRuns}
                      onChange={(e) => setStatsRuns(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="h-4" />
          </form>

          {/* Footer Fijo */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-red-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Atleta' : 'Registrar Atleta'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

