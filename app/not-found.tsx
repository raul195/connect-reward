import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-7xl font-extrabold text-[#0D9488]">404</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1A202C]">
            Page Not Found
          </h1>
          <p className="mt-3 text-lg text-[#64748B]">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110"
            >
              Go Home
            </Link>
            <Link
              href="/early-access"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-[#1A202C] shadow-sm transition-colors hover:bg-gray-50"
            >
              Request Access
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
