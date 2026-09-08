'use client'

import { useState } from 'react';
import { 
  Settings as SettingsIcon, Globe, Trophy, ShieldAlert, 
  Save, Check, AlertCircle, Loader2, Calendar, DollarSign,
  Layers, CheckCircle2, Sparkles, HelpCircle 
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
  };

  const initialCatStates: Record<string, CategoryState> = {};
  categories.forEach((cat) => {
    const hasCustom = cat.grace_period_days !== null && cat.grace_period_days !== undefined;
    initialCatStates[cat.id] = {
      useCustom: hasCustom,
      graceDays: hasCustom ? Number(cat.grace_period_days) : (settings?.grace_period_days ?? 5),
      penalty: hasCustom ? Number(cat.penalty_amount) : (settings?.penalty_amount ?? 10.00),
      saving: false,
      saved: false,
      error: null
    };
  });

  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>(initialCatStates);

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
      setTimeout(() => setGlobalSuccess(false), 3000);
    }
  };

  // Manejador Toggle Personalizar para una categoría
  const handleToggleCustom = (catId: string, enabled: boolean) => {
    setCategoryStates(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        useCustom: enabled,
        saved: false,
        error: null
      }
    }));
  };

  // Manejador Cambio en inputs de categoría
  const handleCategoryFieldChange = (catId: string, field: 'graceDays' | 'penalty', value: number) => {
    setCategoryStates(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: value,
        saved: false
      }
    }));
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
        [catId]: { ...prev[catId], saving: false, saved: true }
      }));
      setTimeout(() => {
        setCategoryStates(prev => {
          if (!prev[catId]) return prev;
          return { ...prev, [catId]: { ...prev[catId], saved: false } };
        });
      }, 3000);
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
                Aplica a todas las disciplinas que no tengan una regla personalizada, o para atletas de nuevo ingreso sin categoría asignada.
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
                Cantidad de días del mes actual que la atleta puede esperar para pagar su mensualidad sin recibir recargo. (Ej: 5 = tiene hasta el día 5 del mes).
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

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            {globalSuccess ? (
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-black bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Regla global guardada exitosamente!</span>
              </div>
            ) : <div />}

            <button 
              type="submit" 
              disabled={savingGlobal}
              className="w-full sm:w-auto bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs sm:text-sm font-black py-3 px-8 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
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
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-2xs shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Reglas Personalizadas por Disciplina
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Adapta los plazos de gracia y multas específicas según las necesidades operativas de cada categoría deportiva.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-200 shadow-2xs self-start sm:self-auto">
            {categories.length} Disciplinas Activas
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
                error: null
              };

              return (
                <div
                  key={cat.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between shadow-2xs ${
                    state.useCustom
                      ? 'bg-amber-50/30 border-amber-300/80 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div>
                    {/* Cabecera de Categoría */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-kasa-vinotinto" />
                          <h3 className="text-base font-black text-gray-900">
                            {cat.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1">
                          {cat.athletesCount ?? 0} atletas inscritas • {cat.teamsCount ?? 0} equipos
                        </p>
                      </div>

                      {/* Micro-badge de Estado */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        state.useCustom
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}>
                        {state.useCustom ? '⭐ Personalizado' : '🌐 Regla Global'}
                      </span>
                    </div>

                    {/* Switch Toggle iOS Style */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between mb-4">
                      <div className="pr-3">
                        <p className="text-xs font-black text-gray-900">
                          Personalizar política para {cat.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                          {state.useCustom 
                            ? 'Usa plazos y multas propios de esta disciplina.' 
                            : `Hereda los ${globalGrace} días de gracia y multa de $${Number(globalPenalty).toFixed(2)}.`}
                        </p>
                      </div>
                      <div className="relative inline-flex items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={state.useCustom}
                          onChange={(e) => handleToggleCustom(cat.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kasa-dorado shadow-inner"></div>
                      </div>
                    </div>

                    {/* Mensaje de Error si aplica */}
                    {state.error && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{state.error}</span>
                      </div>
                    )}

                    {/* Inputs de Morosidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      
                      {/* Días de Gracia */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                          Días de Gracia
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            disabled={!state.useCustom}
                            value={state.useCustom ? state.graceDays : globalGrace}
                            onChange={(e) => handleCategoryFieldChange(cat.id, 'graceDays', Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                            max={31}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs pr-12 ${
                              state.useCustom
                                ? 'bg-white text-gray-900 border-slate-300 focus:ring-2 focus:ring-kasa-dorado/20 focus:border-kasa-dorado outline-none'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-black text-[10px] uppercase">
                            días
                          </div>
                        </div>
                      </div>

                      {/* Penalidad ($) */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                          Penalidad ($)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-black text-xs">
                            $
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            disabled={!state.useCustom}
                            value={state.useCustom ? state.penalty : globalPenalty}
                            onChange={(e) => handleCategoryFieldChange(cat.id, 'penalty', Math.max(0, parseFloat(e.target.value) || 0))}
                            className={`w-full rounded-xl border pl-7 pr-3.5 py-2 text-xs font-mono font-black transition-all shadow-2xs ${
                              state.useCustom
                                ? 'bg-white text-gray-900 border-slate-300 focus:ring-2 focus:ring-kasa-dorado/20 focus:border-kasa-dorado outline-none'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Botón Guardar de la Categoría */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    {state.saved ? (
                      <span className="text-emerald-700 text-xs font-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Guardado
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {state.useCustom ? 'Regla particular activa' : 'Heredando regla global'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveCategory(cat.id)}
                      disabled={state.saving}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {state.saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Aplicar</span>
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
