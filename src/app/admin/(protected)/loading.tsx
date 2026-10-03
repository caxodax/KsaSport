export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Skeleton */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2.5">
          <div className="w-28 h-5 rounded-full skeleton-shimmer" />
          <div className="w-56 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-80 max-w-full h-4 rounded-lg skeleton-shimmer" />
        </div>
        <div className="w-48 h-10 rounded-2xl skeleton-shimmer shrink-0" />
      </div>

      {/* 2. Grid de Métricas KPI Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3.5 rounded-md skeleton-shimmer" />
              <div className="w-10 h-10 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-3 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* 3. Barra de Filtros Skeleton */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="w-full lg:w-80 h-10 rounded-2xl skeleton-shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto flex-1 lg:max-w-2xl">
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* 4. Tabla de Registros Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="w-36 h-5 rounded-md skeleton-shimmer" />
          <div className="w-20 h-6 rounded-full skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <div className="w-36 h-4 rounded-md skeleton-shimmer" />
                  <div className="w-24 h-3 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="hidden sm:block w-32 h-4 rounded-md skeleton-shimmer" />
              <div className="w-24 h-6 rounded-full skeleton-shimmer" />
              <div className="w-8 h-8 rounded-xl skeleton-shimmer shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
