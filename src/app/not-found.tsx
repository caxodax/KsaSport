import Link from 'next/link';
import { Trophy, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-kasa-dorado-dark mb-5 shadow-xs">
          <Trophy className="w-8 h-8 text-amber-700" />
        </div>

        <span className="font-display text-6xl tracking-wider text-kasa-vinotinto leading-none mb-1">
          404
        </span>
        <h2 className="font-display text-2xl uppercase tracking-wider text-slate-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
          La pantalla o recurso que buscas no existe, ha sido movido o no tienes permisos para visualizarlo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-kasa-vinotinto text-white font-bold text-sm shadow-md hover:bg-opacity-95 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            Página Principal
          </Link>
          <Link
            href="/admin"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Panel Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
