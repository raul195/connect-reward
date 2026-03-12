export default function PublicLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-12 animate-pulse rounded bg-gray-200" />
            <div className="h-6 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
