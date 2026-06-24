"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    tag: "Real time detection",
    heading: "Know the moment something breaks",
    body: "Every endpoint is checked every 60 seconds. The instant a site goes down, an alert fires before your users ever notice.",
  },
  {
    tag: "Incident tracking",
    heading: "Every outage, logged and timestamped",
    body: "Incidents are recorded with start time, status code, and error detail. A recovery alert fires automatically when the endpoint comes back online.",
  },
  {
    tag: "Uptime analytics",
    heading: "24hour visibility across all monitors",
    body: "Uptime percentage and average response time calculated across the last 1,440 checks one per minute, per endpoint.",
  },
  {
    tag: "Serverless infrastructure",
    heading: "Zero servers. Runs itself.",
    body: "Built on AWS Lambda, DynamoDB, EventBridge, and SES. No idle infrastructure, no maintenance, no cost on the free tier.",
  },
];

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  // Slower — 7 seconds per slide
  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
      setAnimKey((k) => k + 1);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const current = slides[slide];

  return (
    <div style={{ minHeight: "100vh", background: "#181b21", color: "#c9d1d9" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(20,22,28,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #2a2f38",
        padding: "0 40px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldIcon />
          <span style={{ fontWeight: 700, fontSize: 18, color: "#e6edf3", letterSpacing: "0.01em" }}>Sentinel</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/auth" style={{
            background: "#4a9eff", color: "#fff",
            padding: "7px 18px", borderRadius: 7,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.01em",
            boxShadow: "0 2px 12px rgba(74,158,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 1040, margin: "0 auto",
        padding: "88px 32px 72px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center",
      }}>
        {/* Left — rotating copy */}
        <div>
          <div
            key={`tag-${animKey}`}
            className="fade-in"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 11, fontWeight: 600, color: "#4a9eff",
              textTransform: "uppercase", letterSpacing: "0.12em",
              background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)",
              padding: "4px 12px", borderRadius: 4, marginBottom: 22,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4a9eff" }} />
            {current.tag}
          </div>

          <h1
            key={`h-${animKey}`}
            className="fade-up"
            style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#e6edf3", marginBottom: 20 }}
          >
            {current.heading}
          </h1>

          <p
            key={`p-${animKey}`}
            className="fade-up"
            style={{ fontSize: 16, color: "#6e7681", lineHeight: 1.8, marginBottom: 40, animationDelay: "0.08s" }}
          >
            {current.body}
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
            <Link href="/auth" style={{
              background: "#4a9eff", color: "#fff",
              padding: "11px 26px", borderRadius: 7,
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 18px rgba(74,158,255,0.28)",
            }}>
              Get started
            </Link>
            <a
              href="https://github.com/denzelchingodza/sentinel"
              target="_blank" rel="noopener noreferrer"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#8b949e",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "11px 26px", borderRadius: 7,
                fontSize: 14, fontWeight: 500, textDecoration: "none",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              View Source
            </a>
          </div>

          {/* Progress bar + dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlide(i); setAnimKey((k) => k + 1); }}
                style={{
                  width: i === slide ? 28 : 6, height: 6,
                  borderRadius: 3,
                  background: i === slide ? "#4a9eff" : "#2a2f38",
                  border: "none", cursor: "pointer",
                  transition: "all 0.35s ease", padding: 0,
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: "#3d4450", marginLeft: 4 }}>
              {slide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Right — live panel */}
        <div style={{
          background: "rgba(30,34,40,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          {/* Panel chrome */}
          <div style={{
            background: "rgba(14,16,22,0.8)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "11px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldIcon />
              <span style={{ fontSize: 12, color: "#6e7681", fontWeight: 500, letterSpacing: "0.02em" }}>sentinel / monitors</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e88" }} />
              <span style={{ fontSize: 11, color: "#22c55e" }}>live</span>
            </div>
          </div>

          {/* Rows */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { name: "DocuZen API", url: "api.docuzen.io", uptime: "99.8%", ms: "142ms", status: "up" },
              { name: "Platform Site", url: "denzel.netlify.app", uptime: "100%", ms: "98ms", status: "up" },
              { name: "Auth Service", url: "auth.internal", uptime: "99.2%", ms: "231ms", status: "up" },
            ].map((m) => (
              <div key={m.name} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "11px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", animation: "ping 2.5s ease-out infinite" }} />
                  <div style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#3d4450" }}>{m.url}</div>
                </div>
                <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>{m.uptime}</span>
                <span style={{ fontSize: 12, color: "#4d5562" }}>{m.ms}</span>
              </div>
            ))}

            {/* Status footer */}
            <div style={{
              marginTop: 2, padding: "9px 14px",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.18)",
              borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "#22c55e" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ height: 1, background: "linear-gradient(to right, transparent, #2a2f38, transparent)" }} />
      </div>

      {/* How it works */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "72px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.14em", textAlign: "center", marginBottom: 40 }}>
          How it works
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { step: "01", title: "Add a URL", body: "Register any HTTP endpoint from the dashboard." },
            { step: "02", title: "Lambda checks it", body: "EventBridge triggers a health check every 60 seconds." },
            { step: "03", title: "Results stored", body: "Status, response time, and errors saved to DynamoDB." },
            { step: "04", title: "Alert on change", body: "SES fires an email on down and again on recovery." },
          ].map((s, i) => (
            <div key={s.step} style={{
              background: "rgba(255,255,255,0.03)",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              padding: "28px 24px",
            }}>
              <div style={{ fontSize: 11, color: "#4a9eff", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>{s.step}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e6edf3", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#4d5562", lineHeight: 1.65 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#14161c", padding: "60px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "32px 36px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(74,158,255,0.1)",
            border: "1px solid rgba(74,158,255,0.25)",
            boxShadow: "0 0 20px rgba(74,158,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#4a9eff" }}>D</span>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Built by</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#e6edf3", marginBottom: 8 }}>Denzel Chingodza</div>
            <p style={{ fontSize: 13, color: "#4d5562", lineHeight: 1.75, marginBottom: 16 }}>
              Software Engineering student and developer based in South Africa, building real projects to explore cloud infrastructure, serverless architecture, and full-stack development.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "GitHub", href: "https://github.com/denzelchingodza" },
                { label: "Portfolio", href: "https://platform-nine-ochre.vercel.app" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: 12, color: "#8b949e",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "5px 14px", borderRadius: 6,
                    textDecoration: "none", fontWeight: 500,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      <footer style={{ padding: "24px 32px", textAlign: "center", fontSize: 12, color: "#2a2f38" }}>
        Sentinel · serverless uptime monitoring · AWS free tier
      </footer>
    </div>
  );
}
