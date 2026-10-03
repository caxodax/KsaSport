export default function PaymentsLoading() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* 1. Cabecera Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-2">
          <div className="w-52 h-8 rounded-xl skeleton-shimmer" />
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

      {/* 3. Resumen Superior KPI Skeleton (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="w-24 h-3.5 rounded-md skeleton-shimmer" />
                <div className="flex items-baseline gap-2">
                  <div className="w-16 h-10 rounded-xl skeleton-shimmer" />
                  <div className="w-28 h-6 rounded-lg skeleton-shimmer" />
                </div>
                <div className="w-40 h-3 rounded-md skeleton-shimmer" />
              </div>
              <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Barra de Filtro de Estatus y Búsqueda Skeleton */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="w-24 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-28 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-24 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-24 h-8 rounded-xl skeleton-shimmer" />
        </div>
        <div className="w-full sm:w-64 h-8 rounded-xl skeleton-shimmer" />
      </div>

      {/* 5. Tabla de Reportes Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="w-44 h-5 rounded-md skeleton-shimmer" />
          <div className="w-20 h-6 rounded-full skeleton-shimmer" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <div className="w-36 h-4 rounded-md skeleton-shimmer" />
                  <div className="w-24 h-3 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="hidden sm:block w-32 h-4 rounded-md skeleton-shimmer" />
              <div className="hidden sm:block w-28 h-4 rounded-md skeleton-shimmer" />
              <div className="w-20 h-6 rounded-lg skeleton-shimmer" />
              <div className="w-20 h-6 rounded-full skeleton-shimmer" />
              <div className="w-16 h-8 rounded-xl skeleton-shimmer shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
