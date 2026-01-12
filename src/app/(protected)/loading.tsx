export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="pt-4">
        <div className="h-4 w-24 bg-white/10 rounded mb-2" />
        <div className="h-8 w-48 bg-white/10 rounded" />
      </div>

      {/* Main content skeleton */}
      <div className="bg-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* Secondary content skeleton */}
      <div className="bg-white/5 rounded-2xl p-6">
        <div className="h-20 bg-white/10 rounded" />
      </div>
    </div>
  );
}
