"use client";

import Link from "next/link";

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke="#4a9eff"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(74,158,255,0.08)"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#4a9eff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e6edf3", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav className="nav-pad" style={{ display: "flex", alignItems: "center", padding: "18px 40px", borderBottom: "1px solid #1e2330" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", color: "#e6edf3" }}>
          <ShieldIcon />
          Sentinel
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-padding" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 40px 64px" }}>
        <p style={{ fontSize: 11, color: "#4d5562", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
          Uptime monitoring
        </p>

        <h1 className="hero-title" style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.8px", color: "#e6edf3", marginBottom: 16, maxWidth: 460 }}>
          Know when your sites go down.
        </h1>

        <p style={{ fontSize: 15, color: "#6e7681", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 36px" }}>
          Add a URL. Get an email the moment it goes down, and again when it recovers.
        </p>

        <Link href="/auth" style={{
          background: "#4a9eff", color: "#fff",
          border: "none", borderRadius: 6,
          padding: "11px 28px", fontSize: 14, fontWeight: 500,
          textDecoration: "none", display: "inline-block",
        }}>
          Sign in to get started →
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer-pad" style={{ padding: "20px 40px", borderTop: "1px solid #1e2330", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#3d4450" }}>Built by Denzel Chingodza</span>
        <a
          href="https://github.com/denzelchingodza/sentinel"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#3d4450", textDecoration: "none" }}
        >
          GitHub →
        </a>
      </footer>

    </div>
  );
}
