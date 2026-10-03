export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
        <div className="space-y-2">
          <div className="w-36 h-5 rounded-full skeleton-shimmer" />
          <div className="w-56 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-80 max-w-full h-4 rounded-md skeleton-shimmer" />
        </div>
        <div className="w-48 h-12 rounded-2xl skeleton-shimmer shrink-0" />
      </div>

      {/* 2. Barra de Filtros Skeleton */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="w-full lg:w-72 h-10 rounded-2xl skeleton-shimmer" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64 h-9 rounded-2xl skeleton-shimmer" />
          <div className="w-36 h-9 rounded-2xl skeleton-shimmer" />
          <div className="w-20 h-9 rounded-2xl skeleton-shimmer" />
        </div>
      </div>

      {/* 3. Grid de Productos Skeleton (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 border-l-[6px] border-l-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-4 rounded-md skeleton-shimmer" />
                    <div className="w-20 h-3 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="w-24 h-7 rounded-lg skeleton-shimmer" />
                <div className="w-48 h-3.5 rounded-md skeleton-shimmer" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="w-20 h-6 rounded-full skeleton-shimmer" />
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
                <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
