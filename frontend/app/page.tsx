"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Monitor {
  id: string;
  name: string;
  url: string;
  active: boolean;
  lastStatus: "up" | "down" | "unknown";
  lastChecked: string | null;
  lastResponseTime: number | null;
  createdAt: string;
}

interface Analytics {
  uptime: string;
  avgResponseTime: number;
  total: number;
  checksUp: number;
  checksDown: number;
}

interface Incident {
  id: string;
  monitorId: string;
  url: string;
  startTime: string;
  resolved: boolean;
  statusCode: number;
  error: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusColor(status: string) {
  if (status === "up") return "#4A5C2F";
  if (status === "down") return "#c0392b";
  return "#555";
}

function statusBg(status: string) {
  if (status === "up") return "rgba(74,92,47,0.18)";
  if (status === "down") return "rgba(192,57,43,0.18)";
  return "rgba(85,85,85,0.18)";
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, Analytics>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Add monitor form
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
      if (!monRes.ok) throw new Error("Failed to fetch monitors");
      const mons: Monitor[] = await monRes.json();
      const incs: Incident[] = incRes.ok ? await incRes.json() : [];

      setMonitors(mons);
      setIncidents(incs);

      // Fetch analytics for each monitor
      const analyticsMap: Record<string, Analytics> = {};
      await Promise.all(
        mons.map(async (m) => {
          try {
            const r = await fetch(`${API_BASE}/monitors/${m.id}/analytics`);
            if (r.ok) analyticsMap[m.id] = await r.json();
          } catch {
            // ignore per-monitor analytics errors
          }
        })
      );
      setAnalytics(analyticsMap);
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
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const addMonitor = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setFormLoading(true);
    try {
      const url = formUrl.startsWith("http") ? formUrl : `https://${formUrl}`;
      const res = await fetch(`${API_BASE}/monitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, url }),
      });
      if (!res.ok) throw new Error("Failed to add monitor");
      setFormName("");
      setFormUrl("");
      setShowForm(false);
      await fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error adding monitor");
    } finally {
      setFormLoading(false);
    }
  };

  const deleteMonitor = async (id: string, name: string) => {
    if (!confirm(`Delete monitor "${name}"?`)) return;
    await fetch(`${API_BASE}/monitors/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const upCount = monitors.filter((m) => m.lastStatus === "up").length;
  const downCount = monitors.filter((m) => m.lastStatus === "down").length;
  const overallUptime =
    monitors.length === 0
      ? null
      : (
          monitors.reduce((sum, m) => {
            const a = analytics[m.id];
            return sum + (a ? parseFloat(a.uptime) : 0);
          }, 0) / monitors.length
        ).toFixed(1);

  return (
    <div style={{ minHeight: "100vh", background: "#0d1008", color: "#d4dbb0", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(74,92,47,0.3)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(74,92,47,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: downCount > 0 ? "#c0392b" : "#4A5C2F",
            boxShadow: `0 0 8px ${downCount > 0 ? "#c0392b" : "#4A5C2F"}`
          }} />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: "#a8b87a" }}>SENTINEL</span>
          <span style={{ fontSize: 12, color: "#4A5C2F", marginLeft: 4 }}>uptime monitoring</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#4A5C2F" }}>refreshed {timeAgo(lastRefresh.toISOString())}</span>
          <button
            onClick={fetchAll}
            style={{ background: "rgba(74,92,47,0.2)", border: "1px solid rgba(74,92,47,0.4)", color: "#a8b87a", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            Refresh
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {error && (
          <div style={{ background: "rgba(139,32,32,0.18)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, color: "#e8a0a0", fontSize: 14 }}>
            <strong>Error:</strong> {error} — check that <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: 3 }}>NEXT_PUBLIC_API_URL</code> is set.
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Monitors", value: monitors.length, color: undefined },
            { label: "Online", value: upCount, color: "#4A5C2F" },
            { label: "Down", value: downCount, color: downCount > 0 ? "#c0392b" : undefined },
            { label: "Avg Uptime", value: overallUptime !== null ? `${overallUptime}%` : "—", color: undefined },
            { label: "Active Incidents", value: incidents.length, color: incidents.length > 0 ? "#c0392b" : undefined },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(74,92,47,0.08)", border: "1px solid rgba(74,92,47,0.18)", borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "#4A5C2F", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color || "#a8b87a" }}>{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Active incidents banner */}
        {incidents.length > 0 && (
          <div style={{ background: "rgba(139,32,32,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e8a0a0", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Incidents</div>
            {incidents.map((inc) => {
              const mon = monitors.find((m) => m.id === inc.monitorId);
              return (
                <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid rgba(192,57,43,0.15)" }}>
                  <span style={{ color: "#d4b0b0", fontSize: 14 }}>{mon?.name || inc.url}</span>
                  <span style={{ fontSize: 12, color: "#b08080" }}>down since {timeAgo(inc.startTime)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Monitors section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#a8b87a", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Monitors</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ background: "#4A5C2F", border: "none", color: "#d4dbb0", padding: "8px 18px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            {showForm ? "Cancel" : "+ Add Monitor"}
          </button>
        </div>

        {/* Add monitor form */}
        {showForm && (
          <div style={{ background: "rgba(74,92,47,0.09)", border: "1px solid rgba(74,92,47,0.3)", borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 12, color: "#4A5C2F", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="My Website"
                  style={{ width: "100%", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(74,92,47,0.4)", borderRadius: 6, color: "#d4dbb0", padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 2, minWidth: 220 }}>
                <label style={{ fontSize: 12, color: "#4A5C2F", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>URL</label>
                <input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => e.key === "Enter" && addMonitor()}
                  style={{ width: "100%", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(74,92,47,0.4)", borderRadius: 6, color: "#d4dbb0", padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={addMonitor}
                disabled={formLoading}
                style={{ background: "#4A5C2F", border: "none", color: "#d4dbb0", padding: "9px 24px", borderRadius: 7, cursor: formLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: formLoading ? 0.6 : 1 }}
              >
                {formLoading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Monitor list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#4A5C2F", padding: "60px 0", fontSize: 14 }}>Loading monitors...</div>
        ) : monitors.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4A5C2F", padding: "60px 0", border: "1px dashed rgba(74,92,47,0.25)", borderRadius: 10, fontSize: 14 }}>
            No monitors yet. Add a URL above to start monitoring.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {monitors.map((m) => {
              const a = analytics[m.id];
              return (
                <div
                  key={m.id}
                  style={{
                    background: "rgba(74,92,47,0.05)",
                    border: `1px solid ${m.lastStatus === "down" ? "rgba(192,57,43,0.35)" : "rgba(74,92,47,0.18)"}`,
                    borderRadius: 10,
                    padding: "16px 20px",
                    display: "grid",
                    gridTemplateColumns: "12px 1fr auto auto auto auto",
                    alignItems: "center",
                    gap: "0 18px",
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: statusColor(m.lastStatus),
                    boxShadow: `0 0 6px ${statusColor(m.lastStatus)}`,
                  }} />

                  {/* Name + URL */}
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, color: "#c8d898", marginBottom: 2, fontSize: 15 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "#4A5C2F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.url}</div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    background: statusBg(m.lastStatus),
                    color: statusColor(m.lastStatus),
                    border: `1px solid ${statusColor(m.lastStatus)}`,
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {m.lastStatus}
                  </div>

                  {/* Uptime */}
                  <div style={{ textAlign: "right", minWidth: 72 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#a8b87a" }}>{a ? `${a.uptime}%` : "—"}</div>
                    <div style={{ fontSize: 11, color: "#4A5C2F" }}>uptime</div>
                  </div>

                  {/* Response time */}
                  <div style={{ textAlign: "right", minWidth: 76 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#a8b87a" }}>
                      {m.lastResponseTime !== null ? `${m.lastResponseTime}ms` : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#4A5C2F" }}>response</div>
                  </div>

                  {/* Last checked + delete */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#4A5C2F", marginBottom: 6 }}>{timeAgo(m.lastChecked)}</div>
                    <button
                      onClick={() => deleteMonitor(m.id, m.name)}
                      style={{ background: "transparent", border: "1px solid rgba(192,57,43,0.3)", color: "#8B4444", padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: "center", fontSize: 12, color: "#2a3515" }}>
          Sentinel — serverless uptime monitoring on AWS · checks every 60s · alerts via SES
        </div>
      </main>
    </div>
  );
}
