export default function PortalDashboardLoading() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header con Escudo y Saludo Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
          <div className="space-y-2">
            <div className="w-48 h-6 rounded-md skeleton-shimmer" />
            <div className="w-32 h-4 rounded-md skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
          <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* 2. Grid de Contenido Principal (2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Tarjeta VIP de Solvencia y Estadísticas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tarjeta Solvencia VIP Skeleton */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded-md bg-white/20 skeleton-shimmer" />
              <div className="w-8 h-8 rounded-full bg-white/10 skeleton-shimmer" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 skeleton-shimmer shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-36 h-5 rounded-md bg-white/20 skeleton-shimmer" />
                <div className="w-24 h-3.5 rounded-md bg-white/10 skeleton-shimmer" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="w-28 h-4 rounded-md bg-white/10 skeleton-shimmer" />
              <div className="w-20 h-6 rounded-full bg-white/20 skeleton-shimmer" />
            </div>
          </div>

          {/* Estadísticas de Temporada Skeleton */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="w-48 h-5 rounded-md skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="w-16 h-3 rounded-md skeleton-shimmer" />
                  <div className="w-20 h-8 rounded-lg skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Crédito de Cantina e Historial */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Cantina Skeleton */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="w-44 h-5 rounded-md skeleton-shimmer" />
                <div className="w-60 h-3.5 rounded-md skeleton-shimmer" />
              </div>
              <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          {/* Historial de Transacciones Skeleton */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="w-48 h-5 rounded-md skeleton-shimmer" />
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 sm:px-6 flex items-center justify-between">
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="w-40 h-4 rounded-md skeleton-shimmer" />
                    <div className="w-28 h-3 rounded-md skeleton-shimmer" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="w-20 h-4 rounded-md skeleton-shimmer ml-auto" />
                    <div className="w-24 h-5 rounded-full skeleton-shimmer ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
