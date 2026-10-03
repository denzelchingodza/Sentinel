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
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "#232F3E", borderRadius: 6, padding: "8px 16px", border: "1px solid rgba(255,153,0,0.15)" }}>
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
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 14,
  padding: "28px 28px 26px",
  display: "flex",
  flexDirection: "column",
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#FF9900",
  marginBottom: 14,
};

const BODY: React.CSSProperties = {
  fontSize: 13,
  color: "#5a7d96",
  lineHeight: 1.85,
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
      { threshold: 0.08 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-reveal].in { opacity: 1; transform: translateY(0); }
        .ch:hover { border-color: rgba(255,153,0,0.2) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080f1a", color: "#dce6f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* Wordmark only — no nav buttons */}
        <div style={{ padding: "28px 40px", display: "flex", alignItems: "center", gap: 9 }}>
          <ShieldIcon size={16} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#dce6f0" }}>Sentinel</span>
        </div>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 80px" }}>

          {/* HERO */}
          <div style={{ paddingBottom: 72, maxWidth: 540 }}>
            <div data-reveal data-delay="0"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF9900", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 1, background: "#FF9900" }} />
              Uptime monitoring
            </div>
            <h1 data-reveal data-delay="80"
              style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 18px" }}>
              Know the second<br />your site goes down.
            </h1>
            <p data-reveal data-delay="160"
              style={{ ...BODY, margin: "0 0 32px", maxWidth: 400, fontSize: 15 }}>
              Sentinel checks your URLs every 60 seconds on AWS infrastructure and emails you the moment anything fails, and again when it recovers.
            </p>
            <div data-reveal data-delay="240">
              <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 6, padding: "11px 26px", textDecoration: "none", display: "inline-block" }}>
                Get started
              </Link>
            </div>
          </div>

          {/* STAGGERED CARD GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Card 1: Monitoring */}
              <div data-reveal data-delay="0" className="ch" style={{ ...CARD, transition: "border-color 0.2s ease" }}>
                <div style={LABEL}>Monitoring</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.2 }}>
                  Your apps, checked<br />every 60 seconds.
                </h2>
                <p style={BODY}>
                  Add a URL and EventBridge fires Lambda on a fixed schedule. If it goes down, SES alerts you with what failed and when. When it recovers, you hear about that too.
                </p>
                <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 18, marginTop: 22 }}>
                  {[["60s", "interval"], ["24h", "history"], ["Email", "alerts"]].map(([val, lbl]) => (
                    <div key={lbl} style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#FF9900" }}>{val}</div>
                      <div style={{ fontSize: 10, color: "#2e4a5e", marginTop: 3, letterSpacing: "0.04em" }}>{lbl}</div>
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                </div>
              </div>

              {/* Card 3: Reliability */}
              <div data-reveal data-delay="80" className="ch" style={{ ...CARD, transition: "border-color 0.2s ease" }}>
                <div style={LABEL}>Reliability</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.2 }}>
                  Fault-tolerant<br />by design.
                </h2>
                <p style={BODY}>
                  Each monitor runs in its own error boundary. SES failures fall back to an SQS queue for retry. The Lambda has a dead letter queue. One broken URL cannot affect the rest.
                </p>
                <div style={{ marginTop: 20 }}>
                  {["Per-monitor error isolation", "SES to SQS fallback", "Lambda dead letter queue"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#FF9900", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#3d607a" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN — offset down */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 56 }}>

              {/* Card 2: Infrastructure */}
              <div data-reveal data-delay="100" className="ch" style={{ ...CARD, transition: "border-color 0.2s ease" }}>
                <div style={LABEL}>Infrastructure</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.2 }}>
                  AWS.<br />End to end.
                </h2>
                <p style={BODY}>
                  Every component runs on Amazon Web Services in af-south-1. Compute, storage, auth, email. Provisioned with Terraform.
                </p>
                <div style={{ margin: "18px 0" }}>
                  <AwsMark />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Lambda", "DynamoDB", "SES", "Cognito", "API Gateway", "SQS", "EventBridge"].map((s) => (
                    <span key={s} style={{ fontSize: 10, color: "#3d607a", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "2px 9px" }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Card 4: AI / Intelligence */}
              <div data-reveal data-delay="180" className="ch" style={{ ...CARD, borderColor: "rgba(74,158,255,0.08)", transition: "border-color 0.2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={LABEL}>Intelligence</div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(74,158,255,0.07)", border: "1px solid rgba(74,158,255,0.14)", color: "#4a9eff", borderRadius: 20, padding: "3px 10px" }}>Coming soon</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.2 }}>
                  AI is coming<br />to Sentinel.
                </h2>
                <p style={{ ...BODY, marginBottom: 22 }}>
                  Monitoring tells you what happened. Intelligence will tell you why, and what is coming next.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { title: "Incident prediction", desc: "Detect anomalies before users notice anything." },
                    { title: "Natural language reports", desc: "Plain English summaries of what failed and for how long." },
                    { title: "Smart alerting", desc: "Suppress noise. Surface what actually matters." },
                  ].map((f) => (
                    <div key={f.title} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(74,158,255,0.4)", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#6a8fa8", marginBottom: 2 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: "#3d607a", lineHeight: 1.7 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div data-reveal data-delay="0" className="ch" style={{ ...CARD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 32, padding: "30px 34px", marginTop: 14, transition: "border-color 0.2s ease" }}>
            <div>
              <div style={LABEL}>Get started</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Your first monitor is one URL away.
              </h2>
              <p style={{ ...BODY, margin: 0 }}>Free to use. No card. Add a URL and you are live in under a minute.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 6, padding: "11px 28px", textDecoration: "none", whiteSpace: "nowrap", textAlign: "center" }}>
                Create account
              </Link>
              <Link href="/auth" style={{ background: "transparent", color: "#3d607a", fontSize: 12, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "9px 28px", textDecoration: "none", textAlign: "center" }}>
                Sign in
              </Link>
            </div>
          </div>

        </main>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <ShieldIcon size={13} />
            <span style={{ fontSize: 11, color: "#1e3347", fontWeight: 600 }}>Sentinel</span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/privacy" style={{ fontSize: 11, color: "#1e3347", textDecoration: "none" }}>Privacy</Link>
            <span style={{ fontSize: 11, color: "#152230" }}>2026 Denzel Chingodza · Serverless · af-south-1</span>
          </div>
        </footer>

      </div>
    </>
  );
}
