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

function AwsLogo() {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
      background: "#232F3E", borderRadius: 5, padding: "5px 10px",
      border: "1px solid rgba(255,153,0,0.12)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "0.5px", lineHeight: 1, fontFamily: "Arial Black, Arial, sans-serif" }}>aws</span>
      <svg width="22" height="6" viewBox="0 0 22 6" fill="none">
        <path d="M0.5 3.5 Q11 7.5 21.5 3.5" stroke="#FF9900" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M19.5 1.5 L22 3.5 L19.5 5.5" fill="#FF9900"/>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e6edf3", display: "flex", flexDirection: "column" }}>

      {/* Nav — empty */}
      <nav className="nav-pad" style={{ padding: "18px 40px", height: "60px" }} />

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
      <footer style={{ borderTop: "1px solid #1a1f29", background: "#0b0d13", padding: "48px 40px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Top row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 64px", marginBottom: 40 }}>

            {/* Brand */}
            <div style={{ flex: "1 1 200px", maxWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ShieldIcon />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#e6edf3" }}>Sentinel</span>
              </div>
              <p style={{ fontSize: 13, color: "#3d4450", lineHeight: 1.7, margin: 0 }}>
                Uptime monitoring for your apps. Checks every 60 seconds and emails you the moment something goes down.
              </p>
            </div>

            {/* Product */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/auth" style={{ fontSize: 13, color: "#6e7681", textDecoration: "none" }}>Sign in</Link>
                <Link href="/auth" style={{ fontSize: 13, color: "#6e7681", textDecoration: "none" }}>Create account</Link>
                <Link href="/dashboard" style={{ fontSize: 13, color: "#6e7681", textDecoration: "none" }}>Dashboard</Link>
              </div>
            </div>

            {/* How it works */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>How it works</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Checks your URLs every 60s", "Emails you when a site goes down", "Emails you again when it recovers", "Tracks uptime & response time"].map((t) => (
                  <span key={t} style={{ fontSize: 13, color: "#6e7681" }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Stack */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Infrastructure</div>
              <AwsLogo />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                {["Lambda · DynamoDB · SES", "Cognito · API Gateway · SQS", "Provisioned with Terraform", "Frontend on Vercel"].map((t) => (
                  <span key={t} style={{ fontSize: 12, color: "#3d4450" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid #1a1f29", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#2d333b" }}>
              © 2026{" "}
              <a href="https://denz-platform.vercel.app" target="_blank" rel="noopener noreferrer"
                style={{ color: "#3d4450", textDecoration: "none" }}>
                Denzel Chingodza
              </a>
              . All rights reserved.
            </span>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Link href="/privacy" style={{ fontSize: 11, color: "#3d4450", textDecoration: "none" }}>Privacy</Link>
              <span style={{ fontSize: 11, color: "#2d333b" }}>Serverless · Zero downtime · No servers to manage</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#2d333b" }}>Hosted on</span>
                <AwsLogo />
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
