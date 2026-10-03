export default function AthletesLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
        <div className="space-y-2">
          <div className="w-32 h-5 rounded-full skeleton-shimmer" />
          <div className="w-64 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-80 max-w-full h-4 rounded-lg skeleton-shimmer" />
        </div>
        <div className="w-44 h-12 rounded-2xl skeleton-shimmer shrink-0" />
      </div>

      {/* 2. Barra de Filtros Skeleton */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="w-full lg:w-80 h-10 rounded-2xl skeleton-shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto flex-1 lg:max-w-2xl">
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="w-20 h-7 rounded-lg skeleton-shimmer" />
            <div className="w-28 h-8 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* 3. Grid de Tarjetas de Atletas 360° Skeleton (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 border-l-[6px] border-l-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header de tarjeta */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-13 h-13 rounded-2xl skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-36 h-4 rounded-md skeleton-shimmer" />
                    <div className="w-24 h-3 rounded-md skeleton-shimmer" />
                  </div>
                </div>
                <div className="w-20 h-6 rounded-full skeleton-shimmer shrink-0" />
              </div>

              {/* Badges de equipo y solvencia */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="w-28 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-32 h-6 rounded-lg skeleton-shimmer" />
              </div>

              {/* Stats Grid 4x */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex gap-2">
                <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
              </div>
            </div>

            {/* Footer de tarjeta */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <div className="w-28 h-4 rounded-md skeleton-shimmer" />
              <div className="w-32 h-9 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
