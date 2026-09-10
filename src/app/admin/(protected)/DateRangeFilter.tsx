'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = new Date();
  const defaultStart = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // Leer parámetros actuales de la URL o usar el mes actual por defecto
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const monthParam = searchParams.get('month');

  let initialFrom = defaultStart;
  let initialTo = defaultEnd;

  if (fromParam && toParam) {
    initialFrom = fromParam;
    initialTo = toParam;
  } else if (monthParam) {
    const [y, m] = monthParam.split('-');
    if (y && m) {
      const year = parseInt(y, 10);
      const month = parseInt(m, 10);
      initialFrom = toLocalDateString(new Date(year, month - 1, 1));
      initialTo = toLocalDateString(new Date(year, month, 0));
    }
  }

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Sincronizar estado local si cambia la URL externamente
  useEffect(() => {
    if (fromParam && toParam) {
      setFrom(fromParam);
      setTo(toParam);
    }
  }, [fromParam, toParam]);

  const applyRange = (newFrom: string, newTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', newFrom);
    params.set('to', newTo);
    params.delete('month'); // limpiar parámetro de mes legado
    if (params.has('page')) params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    if (from > to) {
      alert('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }
    applyRange(from, to);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();

    let newFrom = '';
    let newTo = '';

    switch (preset) {
      case 'this_month':
        newFrom = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
        newTo = toLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        break;
      case 'last_month':
        newFrom = toLocalDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        newTo = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      case 'last_7_days': {
        const d7 = new Date(today);
        d7.setDate(today.getDate() - 6);
        newFrom = toLocalDateString(d7);
        newTo = toLocalDateString(today);
        break;
      }
      case 'last_30_days': {
        const d30 = new Date(today);
        d30.setDate(today.getDate() - 29);
        newFrom = toLocalDateString(d30);
        newTo = toLocalDateString(today);
        break;
      }
      case 'this_year':
        newFrom = toLocalDateString(new Date(today.getFullYear(), 0, 1));
        newTo = toLocalDateString(new Date(today.getFullYear(), 11, 31));
        break;
      default:
        return;
    }

    if (newFrom && newTo) {
      setFrom(newFrom);
      setTo(newTo);
      applyRange(newFrom, newTo);
    }
  };

  const resetToDefault = () => {
    setSelectedPreset('this_month');
    setFrom(defaultStart);
    setTo(defaultEnd);
    applyRange(defaultStart, defaultEnd);
  };

  const isFiltered = (fromParam && fromParam !== defaultStart) || (toParam && toParam !== defaultEnd);

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white border border-gray-200 rounded-xl p-2 sm:p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-full"
    >
      {/* Selector de Atajos Rápidos */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Calendar className="w-4 h-4 text-kasa-dorado shrink-0 hidden sm:block" />
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors cursor-pointer"
          aria-label="Atajos de fecha"
        >
          <option value="custom">📅 Período Personalizado</option>
          <option value="this_month">Este Mes</option>
          <option value="last_month">Mes Anterior</option>
          <option value="last_7_days">Últimos 7 días</option>
          <option value="last_30_days">Últimos 30 días</option>
          <option value="this_year">Año en Curso</option>
        </select>
      </div>

      {/* Inputs Desde y Hasta */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-kasa-vinotinto">
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-tight shrink-0">
            Desde
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setSelectedPreset('custom');
            }}
            className="w-full bg-transparent text-xs text-gray-800 font-medium outline-none p-0 cursor-pointer"
            required
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-kasa-vinotinto">
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-tight shrink-0">
            Hasta
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setSelectedPreset('custom');
            }}
            className="w-full bg-transparent text-xs text-gray-800 font-medium outline-none p-0 cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Botones de Acción: Filtrar y Reset */}
      <div className="flex items-center gap-1.5 shrink-0 justify-end">
        <button
          type="submit"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-kasa-vinotinto hover:bg-vinotinto-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:shadow active:scale-95"
          title="Aplicar rango de fechas"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar</span>
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={resetToDefault}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Restablecer al mes actual"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}

