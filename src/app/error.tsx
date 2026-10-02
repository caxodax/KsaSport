'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar error para monitoreo en consola
    console.error('Global application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="font-display text-3xl uppercase tracking-wider text-slate-900 mb-2">
          Algo no salió como esperábamos
        </h2>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
          Ha ocurrido un error inesperado al procesar la solicitud. Esto puede deberse a un problema temporal de red o servidor.
        </p>

        {error?.digest && (
          <div className="mb-6 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-500">
            Código de referencia: <span className="font-bold text-slate-700">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-kasa-vinotinto text-white font-bold text-sm shadow-md hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
