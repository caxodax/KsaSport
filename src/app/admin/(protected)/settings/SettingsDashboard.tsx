'use client'

import { useState } from 'react';
import { 
  Settings as SettingsIcon, Globe, Trophy, ShieldAlert, 
  Save, Check, AlertCircle, Loader2, Calendar, DollarSign,
  Layers, CheckCircle2, Sparkles, HelpCircle, ArrowRight,
  Sliders, Info
} from 'lucide-react';
import { updateGlobalSettings, updateCategoryPenalty } from './actions';

export interface ClubSettings {
  id: number;
  grace_period_days: number;
  penalty_amount: number;
  updated_at?: string;
}

export interface CategorySettingItem {
  id: string;
  name: string;
  grace_period_days?: number | null;
  penalty_amount?: number | null;
  teamsCount?: number;
  athletesCount?: number;
}

export default function SettingsDashboard({
  settings,
  categories = []
}: {
  settings: ClubSettings;
  categories: CategorySettingItem[];
}) {
  // Estado para la Regla Global
  const [globalGrace, setGlobalGrace] = useState(settings?.grace_period_days ?? 5);
  const [globalPenalty, setGlobalPenalty] = useState(settings?.penalty_amount ?? 10.00);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Estados reactivos para cada categoría
  type CategoryState = {
    useCustom: boolean;
    graceDays: number;
    penalty: number;
    saving: boolean;
    saved: boolean;
    error: string | null;
    originalCustom: boolean;
    originalGraceDays: number;
    originalPenalty: number;
  };

  const initialCatStates: Record<string, CategoryState> = {};
  categories.forEach((cat) => {
    const hasCustom = cat.grace_period_days !== null && cat.grace_period_days !== undefined;
    const gDays = hasCustom ? Number(cat.grace_period_days) : (settings?.grace_period_days ?? 5);
    const pAmt = hasCustom ? Number(cat.penalty_amount) : (settings?.penalty_amount ?? 10.00);
    
    initialCatStates[cat.id] = {
      useCustom: hasCustom,
      graceDays: gDays,
      penalty: pAmt,
      saving: false,
      saved: false,
      error: null,
      originalCustom: hasCustom,
      originalGraceDays: gDays,
      originalPenalty: pAmt
    };
  });

  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>(initialCatStates);

  // Helper para icono de disciplina
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fútbol') || lower.includes('futbol') || lower.includes('soccer')) {
      return '⚽';
    }
    if (lower.includes('kickingball') || lower.includes('kick')) {
      return '🏆';
    }
    if (lower.includes('basket') || lower.includes('baloncesto')) {
      return '🏀';
    }
    if (lower.includes('volei') || lower.includes('voley') || lower.includes('volley')) {
      return '🏐';
    }
    return '🏅';
  };

  // Manejador Guardar Regla Global
  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    setGlobalError(null);
    setGlobalSuccess(false);

    const formData = new FormData();
    formData.append('grace_period_days', String(globalGrace));
    formData.append('penalty_amount', String(globalPenalty));

    const res = await updateGlobalSettings(formData);
    setSavingGlobal(false);

    if (res?.error) {
      setGlobalError(res.error);
    } else {
      setGlobalSuccess(true);
      setTimeout(() => setGlobalSuccess(false), 3500);
    }
  };

  // Manejador Toggle Personalizar para una categoría
  const handleToggleCustom = (catId: string, enabled: boolean) => {
    setCategoryStates(prev => {
      const current = prev[catId];
      if (!current) return prev;
      return {
        ...prev,
        [catId]: {
          ...current,
          useCustom: enabled,
          saved: false,
          error: null
        }
      };
    });
  };

  // Manejador Cambio en inputs de categoría
  const handleCategoryFieldChange = (catId: string, field: 'graceDays' | 'penalty', value: number) => {
    setCategoryStates(prev => {
      const current = prev[catId];
      if (!current) return prev;
      return {
        ...prev,
        [catId]: {
          ...current,
          [field]: value,
          saved: false
        }
      };
    });
  };

  // Guardar Política de una Categoría
  const handleSaveCategory = async (catId: string) => {
    const state = categoryStates[catId];
    if (!state) return;

    setCategoryStates(prev => ({
      ...prev,
      [catId]: { ...prev[catId], saving: true, error: null, saved: false }
    }));

    const res = await updateCategoryPenalty(
      catId,
      state.useCustom,
      state.graceDays,
      state.penalty
    );

    if (res?.error) {
      setCategoryStates(prev => ({
        ...prev,
        [catId]: { ...prev[catId], saving: false, error: res.error }
      }));
    } else {
      setCategoryStates(prev => ({
        ...prev,
        [catId]: { 
          ...prev[catId], 
          saving: false, 
          saved: true,
          originalCustom: prev[catId].useCustom,
          originalGraceDays: prev[catId].graceDays,
          originalPenalty: prev[catId].penalty
        }
      }));
      setTimeout(() => {
        setCategoryStates(prev => {
          if (!prev[catId]) return prev;
          return { ...prev, [catId]: { ...prev[catId], saved: false } };
        });
      }, 3500);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-200/80 shadow-2xs flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5" />
              Parámetros & Políticas Financieras
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Configuración de Cobros & Morosidad
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
            Establece los días límite de gracia y los montos de penalidad por mora tanto a nivel general del club como de forma particular para cada disciplina deportiva.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: REGLA GENERAL DE LA ACADEMIA (FALLBACK GLOBAL) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-[6px] border-l-kasa-vinotinto shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-kasa-vinotinto flex items-center justify-center border border-red-200/80 shadow-2xs shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Regla General del Club (Base Global)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Aplica a todas las disciplinas que no tengan una regla personalizada, o para atletas sin categoría específica.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border border-slate-200 self-start sm:self-auto shadow-2xs">
            Regla por Defecto
          </span>
        </div>

        {globalError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGlobal} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Días de Gracia Globales */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 tracking-wider mb-2">
                Días de Gracia (Mes en Curso) *
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={globalGrace}
                  onChange={(e) => setGlobalGrace(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={31}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white text-gray-900 font-bold text-base focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto outline-none shadow-2xs transition-all pr-14"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-black text-xs uppercase">
                  días
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                Cantidad de días del mes actual que la atleta puede esperar para pagar su mensualidad sin recibir recargo.
              </p>
            </div>

            {/* Monto de Penalidad Global */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 tracking-wider mb-2">
                Monto de Penalidad Base ($ USD) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 font-black text-base">
                  $
                </div>
                <input 
                  type="number" 
                  value={globalPenalty}
                  onChange={(e) => setGlobalPenalty(Math.max(0, parseFloat(e.target.value) || 0))}
                  step="0.01"
                  min={0}
                  required
                  className="w-full rounded-2xl border border-slate-300 pl-9 pr-4 py-3 bg-white text-gray-900 font-mono font-black text-base focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto outline-none shadow-2xs transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                Recargo que se sumará a la obligación de la atleta en el portal de pagos al expirar el período de gracia.
              </p>
            </div>

          </div>

          {/* Simulación en vivo de la regla global */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-xs text-slate-700 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-kasa-vinotinto shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-gray-900 block mb-0.5">Efecto de la Regla Base:</span>
              <p className="leading-relaxed font-medium text-slate-600">
                Las atletas tienen hasta el <strong className="font-bold text-gray-900">día {globalGrace}</strong> de cada mes para cancelar su mensualidad sin recargo. A partir del <strong className="font-bold text-gray-900">día {globalGrace + 1}</strong> se sumará automáticamente una penalidad de <strong className="font-bold text-gray-900">${Number(globalPenalty).toFixed(2)} USD</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            {globalSuccess ? (
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-black bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Regla global guardada exitosamente!</span>
              </div>
            ) : <div />}

            <button 
              type="submit" 
              disabled={savingGlobal}
              className="w-full sm:w-auto bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs sm:text-sm font-black py-3 px-8 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {savingGlobal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Regla Global</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: POLÍTICAS ESPECÍFICAS POR DISCIPLINA DEPORTIVA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-[6px] border-l-kasa-dorado shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-2xs shrink-0 text-xl">
              🏆
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Reglas Personalizadas por Disciplina
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Activa o desactiva condiciones particulares para cada deporte, o ajusta sus días y montos de forma individual.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-200 shadow-2xs self-start sm:self-auto">
            {categories.length} Disciplinas Registradas
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-10">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No hay categorías registradas en el sistema</p>
            <p className="text-xs text-slate-400 mt-1">Crea categorías en el módulo de disciplinas para configurar sus penalidades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map((cat) => {
              const state = categoryStates[cat.id] || {
                useCustom: false,
                graceDays: globalGrace,
                penalty: globalPenalty,
                saving: false,
                saved: false,
                error: null,
                originalCustom: false,
                originalGraceDays: globalGrace,
                originalPenalty: globalPenalty
              };

              const isDirty = state.useCustom !== state.originalCustom ||
                (state.useCustom && (state.graceDays !== state.originalGraceDays || state.penalty !== state.originalPenalty));

              const cleanName = cat.name?.trim() || 'Categoría';
              const icon = getCategoryIcon(cleanName);

              return (
                <div
                  key={cat.id}
                  className={`rounded-3xl p-5 sm:p-6 border-2 transition-all flex flex-col justify-between ${
                    state.useCustom
                      ? 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-400/90 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-4">
                    
                    {/* Cabecera de Categoría */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                          state.useCustom 
                            ? 'bg-amber-100 border-amber-300 shadow-2xs' 
                            : 'bg-slate-100 border-slate-200'
                        }`}>
                          {icon}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 leading-tight">
                            {cleanName}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {cat.athletesCount ?? 0} atletas inscritas • {cat.teamsCount ?? 0} equipos
                          </p>
                        </div>
                      </div>

                      {/* Badge de Estado */}
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 shadow-2xs flex items-center gap-1.5 ${
                        state.useCustom
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {state.useCustom ? (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Personalizado
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 text-slate-400" />
                            Regla Global
                          </>
                        )}
                      </span>
                    </div>

                    {/* INTERRUPTOR ACCESIBLE Y 100% CLICKEABLE */}
                    <div 
                      onClick={() => handleToggleCustom(cat.id, !state.useCustom)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                        state.useCustom 
                          ? 'bg-amber-100/50 border-amber-300/80 hover:bg-amber-100/70 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200/90 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                          state.useCustom ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {state.useCustom ? 'ON' : 'OFF'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            ¿Personalizar cobros para {cleanName}?
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                            {state.useCustom 
                              ? 'Activado: usa condiciones particulares para esta disciplina.' 
                              : `Desactivado: hereda los ${globalGrace} días y $${Number(globalPenalty).toFixed(2)} del club.`}
                          </p>
                        </div>
                      </div>

                      {/* Switch Button */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.useCustom}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCustom(cat.id, !state.useCustom);
                        }}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                          state.useCustom ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className="sr-only">Activar política personalizada</span>
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            state.useCustom ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Mensaje de Error si aplica */}
                    {state.error && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{state.error}</span>
                      </div>
                    )}

                    {/* CONTENIDO CONDICIONAL: PERSONALIZADO VS HEREDADO */}
                    {state.useCustom ? (
                      <div className="space-y-3.5 pt-1">
                        {/* Inputs de Morosidad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          {/* Días de Gracia */}
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                              Días de Gracia ({cleanName}) *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={state.graceDays}
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'graceDays', Math.max(0, parseInt(e.target.value) || 0))}
                                min={0}
                                max={31}
                                className="w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold bg-white text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-2xs pr-14"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-black text-[11px] uppercase">
                                días
                              </div>
                            </div>
                          </div>

                          {/* Penalidad ($) */}
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                              Penalidad por Mora ($ USD) *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 font-black text-sm">
                                $
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={state.penalty}
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'penalty', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full rounded-2xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm font-mono font-black bg-white text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-2xs"
                              />
                            </div>
                          </div>

                        </div>

                        {/* Simulación en vivo para la disciplina */}
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-amber-900 block">Simulación en vivo para {cleanName}:</span>
                            <p className="text-amber-900/90 leading-relaxed font-medium">
                              Las atletas de <strong className="font-black text-amber-950">{cleanName}</strong> tienen hasta el <strong className="font-black text-amber-950">día {state.graceDays}</strong> de cada mes para pagar sin recargo. A partir del <strong className="font-black text-amber-950">día {state.graceDays + 1}</strong> se sumará una penalidad de <strong className="font-black text-amber-950">${Number(state.penalty).toFixed(2)} USD</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Estado Desactivado: Heredando Regla General */
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                        <div className="flex items-center gap-2 font-black text-slate-800">
                          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Heredando Política General del Club</span>
                        </div>
                        <p className="leading-relaxed font-medium">
                          Esta disciplina no tiene recargos particulares. Aplica la regla base: hasta el <strong className="font-bold text-gray-900">día {globalGrace}</strong> sin recargo y multa de <strong className="font-bold text-gray-900">${Number(globalPenalty).toFixed(2)} USD</strong> desde el día {globalGrace + 1}.
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          💡 Activa el interruptor arriba si necesitas fijar condiciones diferentes para {cleanName}.
                        </p>
                      </div>
                    )}

                  </div>

                  {/* PIE DE TARJETA: BOTÓN GUARDAR Y RETROALIMENTACIÓN */}
                  <div className="pt-4 mt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {state.saved ? (
                        <span className="text-emerald-700 text-xs font-black flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Guardado en Supabase
                        </span>
                      ) : isDirty ? (
                        <span className="text-[11px] font-black text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Cambios sin guardar
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                          {state.useCustom ? 'Política personalizada activa' : 'Regla general activa'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategory(cat.id)}
                      disabled={state.saving}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                        state.useCustom
                          ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black'
                          : 'bg-slate-900 hover:bg-black active:bg-slate-800 text-white'
                      }`}
                    >
                      {state.saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>
                            {state.useCustom 
                              ? `Guardar Política ${cleanName}` 
                              : `Restablecer a Regla Base`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
