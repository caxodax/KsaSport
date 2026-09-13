'use client'

import { useState } from 'react';
import { 
  DollarSign, RefreshCw, AlertCircle, CheckCircle2, 
  Calendar, ShieldCheck, Landmark, Clock, ArrowUpRight, 
  ArrowDownRight, Plus, HelpCircle, Save, Loader2 
} from 'lucide-react';
import { syncRatesNow, saveManualRateAction } from './rate-actions';
import { ExchangeRateResult, RateHistoryItem } from '@/lib/exchangeRate';

export default function ExchangeRateSettings({
  currentRates,
  history = []
}: {
  currentRates: ExchangeRateResult;
  history: RateHistoryItem[];
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualUsd, setManualUsd] = useState(currentRates.usd ? String(currentRates.usd) : '');
  const [manualEur, setManualEur] = useState(currentRates.eur ? String(currentRates.eur) : '');
  const [savingManual, setSavingManual] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const isUpToDate = currentRates.date === todayStr;

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);

    const res = await syncRatesNow();
    setSyncing(false);

    if (res?.error) {
      setSyncMessage({ type: 'error', text: res.error });
    } else {
      setSyncMessage({ 
        type: 'success', 
        text: `¡Tasas sincronizadas exitosamente! USD: ${res.result?.usd.toFixed(2)} Bs | EUR: ${res.result?.eur.toFixed(2)} Bs (Fuente: ${res.result?.source.toUpperCase()})` 
      });
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManual(true);
    setManualMessage(null);

    const formData = new FormData();
    formData.append('date_rate', manualDate);
    formData.append('usd_rate', manualUsd);
    formData.append('eur_rate', manualEur);

    const res = await saveManualRateAction(formData);
    setSavingManual(false);

    if (res?.error) {
      setManualMessage({ type: 'error', text: res.error });
    } else {
      setManualMessage({ type: 'success', text: 'Tasa oficial guardada manualmente con éxito.' });
      setTimeout(() => {
        setManualMessage(null);
        setShowManualForm(false);
      }, 3000);
    }
  };

  // Agrupar histórico por fecha para mostrar USD y EUR juntos
  const groupedHistoryMap = new Map<string, { date: string; usd?: number; eur?: number; source: string; created_at: string }>();
  history.forEach(item => {
    if (!groupedHistoryMap.has(item.date_rate)) {
      groupedHistoryMap.set(item.date_rate, {
        date: item.date_rate,
        source: item.source,
        created_at: item.created_at
      });
    }
    const entry = groupedHistoryMap.get(item.date_rate)!;
    if (item.currency === 'USD') entry.usd = Number(item.rate);
    if (item.currency === 'EUR') entry.eur = Number(item.rate);
  });
  const groupedHistory = Array.from(groupedHistoryMap.values());

  return (
    <div className="space-y-8">
      
      {/* 1. TARJETA DE TASA VIGENTE DEL DÍA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-[6px] border-l-emerald-600 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>Tasa Oficial del Día</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isUpToDate 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isUpToDate ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isUpToDate ? 'Actualizada Hoy' : `Fecha: ${currentRates.date}`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Fuente oficial para la conversión automática en el portal de atletas y reportes financieros.
              </p>
            </div>
          </div>

          {/* Botón Sincronizar Tasas Ahora */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              title="Ejecutar scrapping del BCV inmediatamente"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{syncing ? 'Sincronizando BCV...' : 'Sincronizar Tasas Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Mensaje de feedback de sincronización */}
        {syncMessage && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 shadow-2xs ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{syncMessage.text}</span>
          </div>
        )}

        {/* Cajas de Tasas Vigentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Tarjeta Dólar BCV */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className="text-base">🇺🇸</span> Dólar Oficial (USD)
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                {currentRates.source.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black text-gray-900 tracking-tight">
                {Number(currentRates.usd).toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-500 font-mono">Bs. / USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Fecha oficial: {currentRates.date}</span>
            </p>
          </div>

          {/* Tarjeta Euro BCV */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className="text-base">🇪🇺</span> Euro Oficial (EUR)
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                {currentRates.source.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black text-gray-900 tracking-tight">
                {Number(currentRates.eur).toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-500 font-mono">Bs. / EUR</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Fecha oficial: {currentRates.date}</span>
            </p>
          </div>

        </div>

        {/* Automatización Cron & Fallback Info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Cron Automático Activo:</strong> Se ejecuta automáticamente a las 7:00 AM y 1:00 PM (hora Venezuela) de lunes a viernes.
            </span>
          </div>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-xs font-bold text-kasa-vinotinto hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showManualForm ? 'Ocultar Carga Manual' : 'Carga Manual de Contingencia'}</span>
          </button>
        </div>

        {/* Formulario de Carga Manual */}
        {showManualForm && (
          <form onSubmit={handleSaveManual} className="mt-5 p-5 bg-amber-50/80 rounded-2xl border border-amber-200/90 space-y-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Carga Manual de Tasa (Uso en caso de caída prolongada del portal del BCV)</span>
            </div>

            {manualMessage && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                manualMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                {manualMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">Fecha de la Tasa *</label>
                <input 
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">Tasa USD (Bs/$) *</label>
                <input 
                  type="number"
                  step="0.0001"
                  value={manualUsd}
                  onChange={(e) => setManualUsd(e.target.value)}
                  placeholder="Ej: 842.2067"
                  required
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">Tasa EUR (Bs/€) *</label>
                <input 
                  type="number"
                  step="0.0001"
                  value={manualEur}
                  onChange={(e) => setManualEur(e.target.value)}
                  placeholder="Ej: 977.8778"
                  required
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingManual}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Guardar Tasa Manual</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* 2. HISTÓRICO DE TASAS DE DÍAS ANTERIORES */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-kasa-vinotinto" />
              <span>Histórico de Tasas Diarias</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Registro inmutable de tasas según el día de la transacción para cortes mensuales, trimestrales y auditorías.
            </p>
          </div>
          <span className="text-xs font-black text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            {groupedHistory.length} fechas registradas
          </span>
        </div>

        {groupedHistory.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Aún no hay histórico acumulado</p>
            <p className="text-xs mt-1">Haz clic en &ldquo;Sincronizar Tasas Ahora&rdquo; para registrar la tasa de hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200">
                  <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Fecha (date_rate)</th>
                  <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Dólar BCV (USD)</th>
                  <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Euro BCV (EUR)</th>
                  <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Fuente</th>
                  <th className="py-3.5 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Hora Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-medium">
                {groupedHistory.map((item) => (
                  <tr key={item.date} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 whitespace-nowrap">
                      {new Date(item.date + 'T12:00:00Z').toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-800 text-sm">
                      {item.usd ? `Bs. ${item.usd.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-800 text-sm">
                      {item.eur ? `Bs. ${item.eur.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        item.source === 'bcv' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : item.source === 'dolarapi' 
                          ? 'bg-sky-50 text-sky-800 border-sky-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

