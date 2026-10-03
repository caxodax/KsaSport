export default function LedgerLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-2">
          <div className="w-56 h-8 rounded-xl skeleton-shimmer" />
          <div className="flex items-center gap-2">
            <div className="w-64 h-4 rounded-md skeleton-shimmer" />
            <div className="w-28 h-5 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="w-40 h-11 rounded-2xl skeleton-shimmer shrink-0" />
      </div>

      {/* 2. Barra de Rango de Fechas Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="w-48 h-4 rounded-md skeleton-shimmer" />
        <div className="w-64 h-9 rounded-xl skeleton-shimmer" />
      </div>

      {/* 3. Grid de Métricas Financieras Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3.5 rounded-md skeleton-shimmer" />
              <div className="w-10 h-10 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
            <div className="w-24 h-3 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* 4. Tabla de Transacciones Conciliadas Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="w-48 h-5 rounded-md skeleton-shimmer" />
          <div className="w-20 h-6 rounded-full skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="w-36 h-4 rounded-md skeleton-shimmer" />
                <div className="w-24 h-3 rounded-md skeleton-shimmer" />
              </div>
              <div className="w-28 h-4 rounded-md skeleton-shimmer hidden sm:block" />
              <div className="w-24 h-6 rounded-lg skeleton-shimmer" />
              <div className="w-20 h-5 rounded-full skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
