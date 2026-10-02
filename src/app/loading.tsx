export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center">
        {/* Anillo de giro exterior con color corporativo vinotinto */}
        <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-kasa-vinotinto animate-spin" />
        {/* Punto dorado central */}
        <div className="absolute w-3.5 h-3.5 rounded-full bg-kasa-dorado animate-ping opacity-75" />
      </div>

      <div className="mt-5 space-y-1">
        <h2 className="font-display text-2xl tracking-widest text-kasa-vinotinto uppercase">
          KSA SPORT
        </h2>
        <p className="text-xs text-slate-500 font-medium animate-pulse">
          Cargando contenido del ecosistema...
        </p>
      </div>
    </div>
  );
}
