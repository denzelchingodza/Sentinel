"use client";

import { useEffect } from "react";
import Link from "next/link";

const BLUE = "#4a9eff";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "#e6edf3",
      }}
    >
      {/* Icon */}
      <div style={{ marginBottom: 24, opacity: 0.4 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <p
        style={{
          fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
          color: BLUE, opacity: 0.7, marginBottom: 16,
        }}
      >
        Something went wrong
      </p>

      <h1
        style={{
          fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 500,
          color: "#e6edf3", letterSpacing: "-0.01em", marginBottom: 10,
        }}
      >
        An unexpected error occurred.
      </h1>

      <p
        style={{
          fontSize: 14, color: "#6e7681", maxWidth: 340,
          lineHeight: 1.7, marginBottom: 32,
        }}
      >
        Something didn&apos;t load correctly. Try refreshing — if it keeps
        happening, the service may be temporarily unavailable.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#0f1117", background: BLUE, border: "none",
            padding: "10px 24px", cursor: "pointer", fontFamily: "inherit",
            borderRadius: 6,
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase",
            color: BLUE, border: `1px solid rgba(74,158,255,0.3)`,
            padding: "10px 24px", textDecoration: "none",
            display: "inline-flex", alignItems: "center", borderRadius: 6,
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
