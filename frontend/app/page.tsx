"use client";

import { useEffect } from "react";
import Link from "next/link";

function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(74,158,255,0.08)" />
      <path d="M9 12l2 2 4-4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AwsMark() {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "#232F3E", borderRadius: 6, padding: "8px 16px", border: "1px solid rgba(255,153,0,0.12)" }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "1px", lineHeight: 1, fontFamily: "Arial Black, Arial, sans-serif" }}>aws</span>
      <svg width="36" height="9" viewBox="0 0 36 9" fill="none" style={{ marginTop: 4 }}>
        <path d="M1 5 Q18 9 35 5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 2.5 L36 5 L32 7.5" fill="#FF9900" />
      </svg>
    </div>
  );
}

const CARD: React.CSSProperties = {
  background: "#0c1520",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 14,
  padding: "28px 28px 24px",
  display: "flex",
  flexDirection: "column",
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#FF9900",
  marginBottom: 16,
};

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.delay || "0");
            setTimeout(() => el.classList.add("in"), delay);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-reveal].in { opacity: 1; transform: translateY(0); }
        .card-hover { transition: border-color 0.2s ease; }
        .card-hover:hover { border-color: rgba(255,153,0,0.18) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080f1a", color: "#e8edf2", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* NAV */}
        <nav style={{ background: "#050b14", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 40px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <ShieldIcon />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#e8edf2" }}>Sentinel</span>
          </div>
          <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 12, borderRadius: 5, padding: "7px 18px", textDecoration: "none" }}>
            Sign in →
          </Link>
        </nav>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>

          {/* HERO */}
          <div style={{ padding: "88px 0 64px", maxWidth: 560 }}>
            <div data-reveal data-delay="0"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF9900", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 18, height: 1, background: "#FF9900" }} />
              Uptime monitoring
            </div>
            <h1 data-reveal data-delay="80"
              style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 18px" }}>
              Know the second<br />your site goes down.
            </h1>
            <p data-reveal data-delay="160"
              style={{ fontSize: 15, color: "#2e4a61", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 420 }}>
              Sentinel checks your URLs every 60 seconds on AWS infrastructure and emails you the moment anything fails — and again when it recovers.
            </p>
            <div data-reveal data-delay="240" style={{ display: "flex", gap: 10 }}>
              <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 5, padding: "10px 24px", textDecoration: "none" }}>
                Get started →
              </Link>
              <Link href="/auth" style={{ background: "transparent", color: "#3d5a73", fontSize: 13, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "9px 20px", textDecoration: "none" }}>
                Sign in
              </Link>
            </div>
          </div>

          {/* ROW 1: Monitoring (large) + Infrastructure (small) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 10, marginBottom: 10 }}>

            {/* MONITORING CARD */}
            <div data-reveal data-delay="0" className="card-hover" style={{ ...CARD }}>
              <div style={LABEL}>Monitoring</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.2 }}>
                Your apps, checked<br />every 60 seconds.
              </h2>
              <p style={{ fontSize: 13, color: "#2a3f54", lineHeight: 1.85, margin: "0 0 auto", paddingBottom: 28 }}>
                Add a URL and EventBridge fires Lambda on a fixed schedule to check it. If it goes down, SES alerts you immediately with what failed and when. When it recovers, you hear about that too.
              </p>
              <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20, marginTop: 4 }}>
                {[["60s", "check interval"], ["24h", "history"], ["Email", "alerts"]].map(([val, label]) => (
                  <div key={label} style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#FF9900", letterSpacing: "-0.01em" }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#1e3347", marginTop: 3, letterSpacing: "0.04em" }}>{label}</div>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
              </div>
            </div>

            {/* INFRASTRUCTURE CARD */}
            <div data-reveal data-delay="100" className="card-hover" style={{ ...CARD }}>
              <div style={LABEL}>Infrastructure</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                AWS.<br />End to end.
              </h2>
              <p style={{ fontSize: 12, color: "#2a3f54", lineHeight: 1.85, margin: "0 0 20px" }}>
                Every component — compute, storage, auth, email — runs on Amazon Web Services in af-south-1.
              </p>
              <div style={{ marginBottom: 20 }}>
                <AwsMark />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
                {["Lambda", "DynamoDB", "SES", "Cognito", "API Gateway", "SQS", "EventBridge"].map((s) => (
                  <span key={s} style={{ fontSize: 10, color: "#1e3347", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "2px 9px" }}>{s}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#152233", marginTop: 14, letterSpacing: "0.04em" }}>Provisioned with Terraform</div>
            </div>
          </div>

          {/* ROW 2: Reliability (small) + AI Coming Soon (large) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.55fr", gap: 10, marginBottom: 10 }}>

            {/* RELIABILITY CARD */}
            <div data-reveal data-delay="0" className="card-hover" style={{ ...CARD }}>
              <div style={LABEL}>Reliability</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.2 }}>
                Fault-tolerant<br />by design.
              </h2>
              <p style={{ fontSize: 12, color: "#2a3f54", lineHeight: 1.85, margin: 0 }}>
                Each monitor runs inside its own error boundary. SES failures fall back to an SQS queue for retry. The Lambda itself has a dead letter queue. One broken URL can&apos;t affect the rest.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                {["Per-monitor error isolation", "SES → SQS fallback", "Lambda dead letter queue"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF9900", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#1e3347" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI COMING SOON CARD */}
            <div data-reveal data-delay="100" className="card-hover" style={{ ...CARD, borderColor: "rgba(74,158,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={LABEL}>Intelligence</div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.15)", color: "#4a9eff", borderRadius: 20, padding: "3px 10px" }}>Coming soon</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.2 }}>
                AI is coming<br />to Sentinel.
              </h2>
              <p style={{ fontSize: 13, color: "#2a3f54", lineHeight: 1.8, margin: "0 0 28px" }}>
                Monitoring tells you what happened. Intelligence will tell you why — and what&apos;s coming next.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: "auto" }}>
                {[
                  { title: "Incident prediction", desc: "Detect anomalies in response time before users report a problem." },
                  { title: "Natural language reports", desc: "Plain English summaries of what failed, for how long, and what was affected." },
                  { title: "Smart alerting", desc: "Suppress noise, group related failures, surface what actually matters." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 12, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(74,158,255,0.35)", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#7a9db8", marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: "#1e3347", lineHeight: 1.7 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA CARD */}
          <div data-reveal data-delay="0" className="card-hover" style={{ ...CARD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 32, padding: "32px 36px" }}>
            <div>
              <div style={LABEL}>Get started</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                Try it. Your first monitor is one URL away.
              </h2>
              <p style={{ fontSize: 13, color: "#2a3f54", lineHeight: 1.7, margin: 0 }}>
                Free to use. No credit card. Sign in with your email and add a URL in under a minute.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 5, padding: "11px 28px", textDecoration: "none", whiteSpace: "nowrap", textAlign: "center" }}>
                Create account →
              </Link>
              <Link href="/auth" style={{ background: "transparent", color: "#3d5a73", fontSize: 12, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "9px 28px", textDecoration: "none", textAlign: "center" }}>
                Sign in
              </Link>
            </div>
          </div>

        </main>

        {/* FOOTER */}
        <footer style={{ background: "#040a12", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "22px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldIcon size={14} />
            <span style={{ fontSize: 12, color: "#0f1e2c", fontWeight: 600 }}>Sentinel</span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/privacy" style={{ fontSize: 11, color: "#0f1e2c", textDecoration: "none" }}>Privacy</Link>
            <span style={{ fontSize: 11, color: "#0a1623" }}>© 2026 Denzel Chingodza · Serverless · af-south-1</span>
          </div>
        </footer>

      </div>
    </>
  );
}
