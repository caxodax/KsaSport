export default function CalendarioLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white p-4 sm:p-8 lg:p-12 flex flex-col items-center">
      {/* 1. Header Hero Skeleton */}
      <div className="w-full max-w-4xl text-center space-y-4 pt-4 sm:pt-8">
        <div className="w-36 h-7 rounded-full bg-white/10 skeleton-shimmer mx-auto" />
        <div className="w-72 sm:w-96 h-10 rounded-2xl bg-white/20 skeleton-shimmer mx-auto" />
        <div className="w-80 max-w-full h-4 rounded-md bg-white/10 skeleton-shimmer mx-auto" />
        <div className="w-56 h-12 rounded-2xl bg-white/20 skeleton-shimmer mx-auto mt-4" />
      </div>

      {/* 2. Slider / Matchday Skeleton Card */}
      <div className="w-full max-w-4xl mt-10">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
          {/* Slider Header */}
          <div className="flex items-center justify-between">
            <div className="w-32 h-6 rounded-md bg-white/10 skeleton-shimmer" />
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 skeleton-shimmer" />
              <div className="w-10 h-10 rounded-xl bg-white/10 skeleton-shimmer" />
            </div>
          </div>

          {/* Slider Preview / Fixture Box */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl bg-white/5 skeleton-shimmer border border-white/5 flex items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 skeleton-shimmer mx-auto" />
              <div className="w-48 h-4 rounded-md bg-white/10 skeleton-shimmer mx-auto" />
            </div>
          </div>

          {/* Slider Pagination Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-white/20 skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
