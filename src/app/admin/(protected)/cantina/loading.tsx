export default function CantinaLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Vinotinto Cantina Skeleton */}
      <div className="bg-gradient-to-r from-red-950 via-kasa-vinotinto to-red-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="w-24 h-5 rounded-full bg-white/20 skeleton-shimmer" />
            <div className="w-60 h-8 rounded-xl bg-white/20 skeleton-shimmer" />
            <div className="w-80 max-w-full h-4 rounded-md bg-white/10 skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-36 h-14 rounded-2xl bg-white/10 skeleton-shimmer" />
            <div className="w-36 h-14 rounded-2xl bg-white/10 skeleton-shimmer" />
          </div>
        </div>

        {/* Pestañas de navegación Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-white/10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-32 h-10 rounded-2xl bg-white/20 skeleton-shimmer shrink-0" />
          ))}
        </div>
      </div>

      {/* 2. Cuerpo POS Skeleton (2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Selección y Catálogo */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-48 h-6 rounded-md skeleton-shimmer" />
              <div className="w-20 h-4 rounded-md skeleton-shimmer" />
            </div>
            <div className="w-full h-10 rounded-2xl skeleton-shimmer" />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-48 h-6 rounded-md skeleton-shimmer" />
              <div className="flex gap-2">
                <div className="w-16 h-7 rounded-xl skeleton-shimmer" />
                <div className="w-16 h-7 rounded-xl skeleton-shimmer" />
                <div className="w-16 h-7 rounded-xl skeleton-shimmer" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl p-4 border border-gray-100 space-y-2.5">
                  <div className="w-full h-4 rounded-md skeleton-shimmer" />
                  <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
                  <div className="w-full h-8 rounded-xl skeleton-shimmer mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Comanda / Carrito */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="w-40 h-6 rounded-md skeleton-shimmer" />
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-28 h-3 rounded-md skeleton-shimmer" />
              <div className="w-36 h-6 rounded-md skeleton-shimmer" />
            </div>
            <div className="divide-y divide-gray-100 py-2 space-y-3">
              <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              <div className="w-full h-10 rounded-xl skeleton-shimmer" />
            </div>
            <div className="w-full h-12 rounded-2xl skeleton-shimmer mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
