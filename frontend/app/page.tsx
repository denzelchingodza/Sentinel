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
      <nav className="nav-pad" style={{ display: "flex", alignItems: "center", padding: "18px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", color: "#e6edf3" }}>
          <ShieldIcon />
          Sentinel
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-padding" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 40px 64px" }}>
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
      <footer style={{ borderTop: "1px solid #1e2330", background: "#0b0e15" }}>

        {/* Top grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 32, padding: "40px 40px 28px",
          borderBottom: "1px solid #1e2330",
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <ShieldIcon />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3", letterSpacing: "-0.2px" }}>Sentinel</span>
            </div>
            <p style={{ fontSize: 13, color: "#484f58", lineHeight: 1.65, maxWidth: 220 }}>
              Uptime monitoring built on AWS. Add a URL, get an email when it goes down and when it recovers.
            </p>
          </div>

          {/* Project */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3d4450", marginBottom: 14, fontWeight: 500 }}>Project</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "https://github.com/denzelchingodza/sentinel", label: "github.com/denzelchingodza/sentinel", icon: "github" },
                { href: "https://sentinel-kappa-wine.vercel.app", label: "Live app", icon: "external" },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6e7681", textDecoration: "none" }}>
                  {l.icon === "github" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d4450" strokeWidth="1.8"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d4450" strokeWidth="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  )}
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3d4450", marginBottom: 14, fontWeight: 500 }}>Connect</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "https://github.com/denzelchingodza", label: "github.com/denzelchingodza", icon: "github" },
                { href: "https://www.linkedin.com/in/denzel-chingodza-45b6ab3a0/", label: "Denzel Chingodza", icon: "linkedin" },
                { href: "https://denz-platform.vercel.app", label: "denz-platform.vercel.app", icon: "portfolio" },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6e7681", textDecoration: "none" }}>
                  {l.icon === "github" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d4450" strokeWidth="1.8"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>}
                  {l.icon === "linkedin" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d4450" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>}
                  {l.icon === "portfolio" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d4450" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
                  {l.label}
                </a>
              ))}
            </div>
            <a href="https://www.linkedin.com/in/denzel-chingodza-45b6ab3a0/" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, background: "#4a9eff", color: "#fff", fontSize: 12, padding: "9px 18px", borderRadius: 5, textDecoration: "none", letterSpacing: "0.02em" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              Connect on LinkedIn
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#3d4450" }}>
            Built by{" "}
            <a href="https://denz-platform.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: "#484f58", textDecoration: "none" }}>
              Denzel Chingodza
            </a>{" "}
            · 2026
          </span>
          <span style={{ fontSize: 11, color: "#2d333b", letterSpacing: "0.04em" }}>Next.js · AWS Lambda · DynamoDB · EventBridge · Terraform</span>
        </div>

      </footer>

    </div>
  );
}
