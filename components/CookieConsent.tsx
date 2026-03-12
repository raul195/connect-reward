"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function respond(value: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1E293B] px-4 py-4 shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-relaxed text-gray-300 sm:text-left">
          We use cookies to improve your experience. By continuing to use
          Connect Reward, you agree to our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-white"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => respond("declined")}
            className="rounded-md border border-gray-500 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-300 hover:text-white"
          >
            Decline
          </button>
          <button
            onClick={() => respond("accepted")}
            className="rounded-md bg-[#0D9488] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f766e]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
