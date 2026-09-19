"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function IntroSplash() {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Hold for 2s, then slide up. Unmount only after the slide has finished (2000 + 900ms + buffer).
    const exitTimer = window.setTimeout(() => setIsExiting(true), 2000);
    const removeTimer = window.setTimeout(() => setIsMounted(false), 2950);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div
      aria-label="Plain Culture"
      className={`fixed inset-0 z-[100] grid place-items-center bg-[#004C33] will-change-transform transition-transform duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <Image
        src="/logo.png"
        alt="Plain Culture"
        width={260}
        height={126}
        className="h-auto w-48 object-contain sm:w-64"
        priority
      />
    </div>
  );
}