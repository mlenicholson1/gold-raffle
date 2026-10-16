"use client";

import { useState } from "react";

// Pulls the logo set in the admin dashboard (falls back to rendering
// nothing if none has been uploaded, rather than a placeholder).
export default function Logo({ className = "h-8" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/logo"
      alt="World Gold Council"
      className={`block w-auto object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
