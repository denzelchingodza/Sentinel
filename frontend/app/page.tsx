"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";

function ShieldIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke="var(--cf)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
      <path d="M9 12l2 2 4-4" stroke="var(--cf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AwsMark() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, lineHeight: 0, position: "relative" }}>
      <span style={{ fontSize: 10, color: "var(--cs)", letterSpacing: "0.06em", fontWeight: 400 }}>Powered by</span>
      <span style={{ display: "inline-block", lineHeight: 0, position: "relative", width: 68, height: 40 }}>
        <img src="/aws-logo-dark.svg" alt="AWS" width={68} height={40}
          className="aws-badge-dark" style={{ display: "block" }} />
        <img src="/aws-logo-light.svg" alt="" aria-hidden width={68} height={40}
          className="aws-badge-light" style={{ position: "absolute", inset: 0 }} />
      </span>
    </span>
  );
}

const CARD: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--bd)",
  borderRadius: 14,
  padding: "28px 28px 26px",
  display: "flex",
  flexDirection: "column",
};

const BODY: React.CSSProperties = {
  fontSize: 13,
  color: "var(--cb)",
  lineHeight: 1.85,
};

const HEADING: React.CSSProperties = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  color: "var(--ch)",
  letterSpacing: "-0.01em",
  margin: "0 0 12px",
  lineHeight: 1.2,
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        [data-reveal] {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-reveal].in { opacity: 1; transform: translateY(0); }
        .ch { transition: border-color 0.2s ease; }
        .ch:hover { border-color: rgba(255,153,0,0.2) !important; }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 7px;
          text-decoration: none;
          font-size: 13.5px;
          color: var(--cs);
          transition: background 0.15s ease, color 0.15s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .menu-item:hover { background: var(--bd); color: var(--ch); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ch)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left: wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldIcon />
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--clo)", letterSpacing: "0.04em" }}>Sentinel</span>
          </div>

          {/* Right: wordmark + hamburger */}
          <div ref={menuRef} style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--cs)", letterSpacing: "0.05em" }}>Sentinel</span>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px", display: "flex", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center" }}
            >
              <span style={{ display: "block", width: 20, height: 2, background: "var(--cb)", borderRadius: 2 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "var(--cb)", borderRadius: 2 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "var(--cb)", borderRadius: 2 }} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "6px", minWidth: 220, zIndex: 100, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                <Link href="/auth" onClick={() => setMenuOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 7, textDecoration: "none", fontSize: 13.5, fontWeight: 600, background: "#FF9900", color: "#000", marginBottom: 4 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Create account
                </Link>

                <Link href="/auth" onClick={() => setMenuOpen(false)} className="menu-item">
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Sign in
                </Link>

                <div style={{ height: 1, background: "var(--bd)", margin: "5px 0" }} />

                <Link href="/privacy" onClick={() => setMenuOpen(false)} className="menu-item" style={{ fontSize: 12.5, color: "var(--cs)" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Privacy
                </Link>

                <a href="mailto:denzel.chingodza@icloud.com" onClick={() => setMenuOpen(false)} className="menu-item" style={{ fontSize: 12.5, color: "var(--cs)" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Contact
                </a>

                <a href="https://github.com/denzelchingodza/Sentinel" target="_blank" rel="noopener" onClick={() => setMenuOpen(false)} className="menu-item" style={{ fontSize: 12.5, color: "var(--cs)" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                  GitHub
                </a>

                <div style={{ height: 1, background: "var(--bd)", margin: "5px 0" }} />
                <ThemeToggle style={{ fontSize: 12.5 }} />
              </div>
            )}
          </div>
        </div>

        <main className="page-pad" style={{ padding: "20px 48px 80px" }}>

          {/* HERO */}
          <div style={{ paddingBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
            <div>
              <h1 data-reveal data-delay="0"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(36px, 5.5vw, 56px)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.01em", color: "var(--ch)", margin: "0 0 16px" }}>
                URL monitoring<br />on AWS.
              </h1>
              <p data-reveal data-delay="80"
                style={{ ...BODY, fontSize: 14, maxWidth: 380, margin: 0, color: "var(--cb)" }}>
                Checks your URLs every 60 seconds. Emails you when something goes down, and again when it recovers.
              </p>
            </div>
          </div>

          {/* STAGGERED CARD GRID */}
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div data-reveal data-delay="0" className="ch" style={CARD}>
                <h2 style={HEADING}>Your apps, checked<br />every 60 seconds.</h2>
                <p style={BODY}>
                  Add a URL and EventBridge fires Lambda on a fixed schedule. If it goes down, SES alerts you with what failed and when. When it recovers, you hear about that too.
                </p>
                <div style={{ display: "flex", borderTop: "1px solid var(--bd-faint)", paddingTop: 18, marginTop: 22 }}>
                  {[["60s", "interval"], ["24h", "history"], ["Email", "alerts"]].map(([val, lbl]) => (
                    <div key={lbl} style={{ flex: 1, borderRight: "1px solid var(--bd-faint)" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#FF9900" }}>{val}</div>
                      <div style={{ fontSize: 10, color: "var(--cs)", marginTop: 3, letterSpacing: "0.04em" }}>{lbl}</div>
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                </div>
              </div>

              <div data-reveal data-delay="80" className="ch" style={CARD}>
                <h2 style={HEADING}>Fault-tolerant<br />by design.</h2>
                <p style={BODY}>
                  Each monitor runs in its own error boundary. SES failures fall back to an SQS queue for retry. The Lambda has a dead letter queue. One broken URL cannot affect the rest.
                </p>
                <div style={{ marginTop: 20 }}>
                  {["Per-monitor error isolation", "SES to SQS fallback", "Lambda dead letter queue"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#FF9900", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--cs)" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN — offset */}
            <div className="card-right-col" style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 56 }}>

              <div data-reveal data-delay="100" className="ch" style={CARD}>
                <h2 style={HEADING}>AWS.<br />End to end.</h2>
                <p style={BODY}>
                  Every component runs on Amazon Web Services in af-south-1. Compute, storage, auth, email. Provisioned with Terraform.
                </p>
                <div style={{ margin: "18px 0" }}>
                  <AwsMark />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Lambda", "DynamoDB", "SES", "Cognito", "API Gateway", "SQS", "EventBridge"].map((s) => (
                    <span key={s} style={{ fontSize: 10, color: "var(--cs)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--bd)", borderRadius: 20, padding: "2px 9px" }}>{s}</span>
                  ))}
                </div>
              </div>

              <div data-reveal data-delay="180" className="ch" style={CARD}>
                <h2 style={{ ...HEADING, marginBottom: 6 }}>AI is coming<br />to Sentinel.</h2>
                <span style={{ fontSize: 10, color: "var(--cd)", letterSpacing: "0.06em", marginBottom: 14, display: "block" }}>coming soon</span>
                <p style={{ ...BODY, marginBottom: 22 }}>
                  Monitoring tells you what happened. Intelligence will tell you why, and what is coming next.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { title: "Incident prediction", desc: "Detect anomalies before users notice anything." },
                    { title: "Natural language reports", desc: "Plain English summaries of what failed and for how long." },
                    { title: "Smart alerting", desc: "Suppress noise. Surface what actually matters." },
                  ].map((f) => (
                    <div key={f.title} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--bd-faint)" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(74,158,255,0.25)", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cb)", marginBottom: 2 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: "var(--cs)", lineHeight: 1.7 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* CTA — just the buttons */}
          <div data-reveal data-delay="0" style={{ borderTop: "1px solid var(--bd-faint)", marginTop: 64, paddingTop: 48, display: "flex", justifyContent: "center", gap: 12 }}>
            <Link href="/auth" style={{ background: "#FF9900", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 6, padding: "11px 32px", textDecoration: "none" }}>
              Create account
            </Link>
            <Link href="/auth" style={{ background: "transparent", color: "var(--cs)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 28px", textDecoration: "none" }}>
              Sign in
            </Link>
          </div>

        </main>

        <footer className="footer-pad footer-grid" style={{ borderTop: "1px solid var(--bd-faint)", padding: "40px 48px 32px", display: "grid", gridTemplateColumns: "1fr auto", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                  stroke="var(--cf)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
                <path d="M9 12l2 2 4-4" stroke="var(--cf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontWeight: 600, fontSize: 12, color: "var(--clo)" }}>Sentinel</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--cs)", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 300 }}>
              URL monitoring built on AWS. Checks every 60 seconds, alerts on downtime. A personal project by Denzel Chingodza.
            </p>
            <span style={{ fontSize: 11, color: "var(--cd)" }}>Lambda · DynamoDB · SES · Cognito · SQS · EventBridge · af-south-1</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <Link href="/privacy" style={{ fontSize: 11, color: "var(--cs)", textDecoration: "none" }}>Privacy</Link>
              <a href="mailto:denzel.chingodza@icloud.com" style={{ fontSize: 11, color: "var(--cd)", textDecoration: "none" }}>denzel.chingodza@icloud.com</a>
            </div>
            <span style={{ fontSize: 11, color: "var(--cd)" }}>2026</span>
          </div>
        </footer>

      </div>
    </>
  );
}
