// TODO: CatalogAPI integration — not yet active
// This store page was connected to an external CatalogAPI for browsing
// third-party rewards. It is disabled until CatalogAPI is ready to launch.
// The rewards catalog is currently manual-only (business owners create
// their own rewards, customers browse them at /dashboard/rewards).

"use client";

export default function StorePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold text-gray-500">Coming Soon</p>
      <p className="mt-2 text-sm text-gray-400">
        The reward store is not yet available.
      </p>
    </div>
  );
}
