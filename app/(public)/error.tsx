"use client";

import Link from "next/link";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center">
        <p className="text-5xl font-extrabold text-red-500">Oops</p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1A202C]">
          Something went wrong
        </h1>
        <p className="mt-3 text-[#64748B]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-[#1A202C] shadow-sm transition-colors hover:bg-gray-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
