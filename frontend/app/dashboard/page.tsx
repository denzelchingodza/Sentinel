"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(74,158,255,0.08)" />
      <path d="M9 12l2 2 4-4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  lastStatus: "up" | "down" | "unknown";
  lastChecked: string | null;
  lastResponseTime: number | null;
}

interface Analytics {
  uptime: string;
  avgResponseTime: number;
  total: number;
}

interface Incident {
  id: string;
  monitorId: string;
  url: string;
  startTime: string;
  error: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function UptimeBar({ uptime }: { uptime: string }) {
  const pct = parseFloat(uptime);
  const color = pct >= 99 ? "#16a34a" : pct >= 95 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 72, height: 3, background: "#2a2f38", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 40, textAlign: "right" }}>{uptime}%</span>
    </div>
  );
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, Analytics>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [monRes, incRes] = await Promise.all([
        fetch(`${API_BASE}/monitors`),
        fetch(`${API_BASE}/incidents`),
      ]);
      if (!monRes.ok) throw new Error("API unreachable");
      const mons: Monitor[] = await monRes.json();
      const incs: Incident[] = incRes.ok ? await incRes.json() : [];
      setMonitors(mons);
      setIncidents(incs);
      const aMap: Record<string, Analytics> = {};
      await Promise.all(
        mons.map(async (m) => {
          try {
            const r = await fetch(`${API_BASE}/monitors/${m.id}/analytics`);
            if (r.ok) aMap[m.id] = await r.json();
          } catch { /* ignore */ }
        })
      );
      setAnalytics(aMap);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const addMonitor = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setFormLoading(true);
    try {
      const url = formUrl.startsWith("http") ? formUrl : `https://${formUrl}`;
      await fetch(`${API_BASE}/monitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, url }),
      });
      setFormName(""); setFormUrl(""); setShowForm(false);
      await fetchAll();
    } catch { alert("Failed to add monitor"); }
    finally { setFormLoading(false); }
  };

  const deleteMonitor = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    await fetch(`${API_BASE}/monitors/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const upCount = monitors.filter((m) => m.lastStatus === "up").length;
  const downCount = monitors.filter((m) => m.lastStatus === "down").length;
  const allUp = !loading && monitors.length > 0 && downCount === 0;
  const avgUptime = monitors.length === 0 ? null :
    (monitors.reduce((s, m) => s + (analytics[m.id] ? parseFloat(analytics[m.id].uptime) : 100), 0) / monitors.length).toFixed(1);
  const respondingMonitors = monitors.filter(m => m.lastResponseTime);
  const avgMs = respondingMonitors.length > 0
    ? Math.round(respondingMonitors.reduce((s, m) => s + (m.lastResponseTime || 0), 0) / respondingMonitors.length)
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#181b21", color: "#c9d1d9" }}>

      {/* Nav */}
      <nav style={{ background: "#14161c", borderBottom: "1px solid #2a2f38", padding: "0 28px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <ShieldIcon size={18} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#e6edf3" }}>Sentinel</span>
          </Link>
          <div style={{ width: 1, height: 16, background: "#2a2f38" }} />
          <span style={{ fontSize: 13, color: "#3d4450" }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#3d4450" }}>{timeAgo(lastRefresh.toISOString())}</span>
          <button onClick={fetchAll}
            style={{ background: "#1e2228", border: "1px solid #2a2f38", color: "#6e7681", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
            Refresh
          </button>
          <button onClick={() => setShowForm((v) => !v)}
            style={{ background: showForm ? "#1e2228" : "#4a9eff", border: showForm ? "1px solid #2a2f38" : "none", color: showForm ? "#6e7681" : "#fff", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {showForm ? "Cancel" : "+ Monitor"}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Incidents */}
        {incidents.length > 0 && (
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {incidents.length} active incident{incidents.length > 1 ? "s" : ""}
              </span>
            </div>
            {incidents.map((inc) => {
              const mon = monitors.find((m) => m.id === inc.monitorId);
              return (
                <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid rgba(239,68,68,0.15)", fontSize: 13 }}>
                  <span style={{ color: "#fca5a5", fontWeight: 500 }}>{mon?.name || inc.url}</span>
                  <span style={{ color: "#4d5562" }}>since {timeAgo(inc.startTime)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div style={{ background: "#1e2228", border: "1px solid #2a2f38", borderRadius: 10, padding: "16px 18px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 130px" }}>
              <label style={{ fontSize: 10, color: "#3d4450", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My API"
                style={{ width: "100%", background: "#14161c", border: "1px solid #2a2f38", borderRadius: 6, color: "#e6edf3", padding: "8px 11px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: "2 1 200px" }}>
              <label style={{ fontSize: 10, color: "#3d4450", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>URL</label>
              <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com"
                onKeyDown={(e) => e.key === "Enter" && addMonitor()}
                style={{ width: "100%", background: "#14161c", border: "1px solid #2a2f38", borderRadius: 6, color: "#e6edf3", padding: "8px 11px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={addMonitor} disabled={formLoading}
              style={{ background: "#4a9eff", border: "none", color: "#fff", padding: "9px 20px", borderRadius: 7, cursor: formLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? "Adding…" : "Add"}
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total", value: loading ? "—" : monitors.length, color: undefined },
            { label: "Online", value: loading ? "—" : upCount, color: upCount > 0 && !loading ? "#22c55e" : undefined },
            { label: "Down", value: loading ? "—" : downCount, color: downCount > 0 ? "#ef4444" : undefined },
            { label: "Avg response", value: loading ? "—" : avgMs ? `${avgMs}ms` : "—", color: undefined },
          ].map((c) => (
            <div key={c.label} style={{ background: "#1e2228", border: "1px solid #2a2f38", borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.color || "#e6edf3" }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Monitor list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#3d4450", padding: "60px 0", fontSize: 14 }}>Loading…</div>
        ) : monitors.length === 0 ? (
          <div style={{ background: "#1e2228", border: "1px dashed #2a2f38", borderRadius: 10, padding: "56px 24px", textAlign: "center", color: "#3d4450", fontSize: 14 }}>
            No monitors yet — add one to get started.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 132px 100px 90px 60px 32px", alignItems: "center", gap: "0 14px", padding: "6px 16px", marginBottom: 4 }}>
              {["", "Monitor", "Uptime (24h)", "Response", "Status", "Checked", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 10, color: "#3d4450", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i >= 2 ? "right" : "left" }}>{h}</span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {monitors.map((m) => {
                const a = analytics[m.id];
                const isUp = m.lastStatus === "up";
                const isDown = m.lastStatus === "down";
                const msColor = !m.lastResponseTime ? "#4d5562"
                  : m.lastResponseTime < 500 ? "#22c55e"
                  : m.lastResponseTime < 2000 ? "#f59e0b"
                  : "#ef4444";

                return (
                  <div key={m.id} style={{
                    background: "#1e2228",
                    border: `1px solid ${isDown ? "rgba(239,68,68,0.3)" : "#2a2f38"}`,
                    borderRadius: 9, padding: "13px 16px",
                    display: "grid", gridTemplateColumns: "20px 1fr 132px 100px 90px 60px 32px",
                    alignItems: "center", gap: "0 14px",
                  }}>
                    <div style={{ position: "relative", width: 9, height: 9 }}>
                      {isUp && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", animation: "ping 2.5s ease-out infinite" }} />}
                      <div style={{ position: "relative", width: 9, height: 9, borderRadius: "50%", background: isUp ? "#22c55e" : isDown ? "#ef4444" : "#2a2f38" }} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#e6edf3", marginBottom: 1 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#3d4450", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.url}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {a ? <UptimeBar uptime={a.uptime} /> : <span style={{ fontSize: 12, color: "#3d4450" }}>—</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: msColor }}>
                        {m.lastResponseTime !== null ? `${m.lastResponseTime}ms` : "—"}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                        background: isUp ? "rgba(34,197,94,0.1)" : isDown ? "rgba(239,68,68,0.1)" : "rgba(74,85,98,0.2)",
                        color: isUp ? "#22c55e" : isDown ? "#ef4444" : "#4d5562",
                        border: `1px solid ${isUp ? "rgba(34,197,94,0.25)" : isDown ? "rgba(239,68,68,0.25)" : "#2a2f38"}`,
                      }}>
                        {m.lastStatus}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "#3d4450" }}>{timeAgo(m.lastChecked)}</div>
                    <button onClick={() => deleteMonitor(m.id, m.name)}
                      style={{ background: "transparent", border: "1px solid #2a2f38", color: "#3d4450", width: 28, height: 28, borderRadius: 5, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {avgUptime && (
              <div style={{ marginTop: 10, padding: "10px 16px", background: "#14161c", border: "1px solid #2a2f38", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#3d4450" }}>{monitors.length} monitor{monitors.length !== 1 ? "s" : ""} · checks every 60s</span>
                <span style={{ fontSize: 12, color: "#3d4450" }}>avg uptime <span style={{ color: "#22c55e", fontWeight: 600 }}>{avgUptime}%</span></span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
