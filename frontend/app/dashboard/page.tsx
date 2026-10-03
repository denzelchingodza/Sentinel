 "use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getIdToken, signOut, getSession } from "../../lib/cognito";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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
  const color = pct >= 99 ? "#22c55e" : pct >= 95 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 72, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 40, textAlign: "right" }}>{uptime}%</span>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "#06111e",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 7,
  color: "#dce6f0",
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail]     = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [monitors, setMonitors]       = useState<Monitor[]>([]);
  const [analytics, setAnalytics]     = useState<Record<string, Analytics>>({});
  const [incidents, setIncidents]     = useState<Incident[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showForm, setShowForm]       = useState(false);
  const [formName, setFormName]       = useState("");
  const [formUrl, setFormUrl]         = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSession().then((session) => {
      if (!active) return;
      if (!session) { router.replace("/auth"); return; }
      const payload = session.getIdToken().decodePayload();
      setUserEmail((payload.email as string) ?? null);
      setAuthChecked(true);
    });
    return () => { active = false; };
  }, [router]);

  const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    const tok = await getIdToken();
    return fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts.headers, Authorization: `Bearer ${tok}` },
    });
  }, []);

  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  useEffect(() => {
    if (!authChecked) return;
    let active = true;
    async function fetchAll() {
      const fetch_ = authFetchRef.current;
      try {
        const [monRes, incRes] = await Promise.all([
          fetch_(`${API_BASE}/monitors`),
          fetch_(`${API_BASE}/incidents`),
        ]);
        if (!active) return;
        if (monRes.status === 401 || monRes.status === 403) { signOut(); router.replace("/auth"); return; }
        if (!monRes.ok) throw new Error("API unreachable");
        const mons: Monitor[] = await monRes.json();
        const incs: Incident[] = incRes.ok ? await incRes.json() : [];
        const aMap: Record<string, Analytics> = {};
        await Promise.all(mons.map(async (m) => {
          try {
            const r = await fetch_(`${API_BASE}/monitors/${m.id}/analytics`);
            if (r.ok) aMap[m.id] = await r.json();
          } catch { /* ignore */ }
        }));
        if (!active) return;
        setMonitors(mons); setIncidents(incs); setAnalytics(aMap);
        setLastRefresh(new Date()); setError(null);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => { active = false; clearInterval(t); };
  }, [authChecked, refreshKey, router]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const addMonitor = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setFormLoading(true);
    try {
      const url = formUrl.startsWith("http") ? formUrl : `https://${formUrl}`;
      await authFetch(`${API_BASE}/monitors`, { method: "POST", body: JSON.stringify({ name: formName, url }) });
      setFormName(""); setFormUrl(""); setShowForm(false); refresh();
    } catch { alert("Failed to add monitor"); }
    finally { setFormLoading(false); }
  };

  const deleteMonitor = async (id: string) => {
    await authFetch(`${API_BASE}/monitors/${id}`, { method: "DELETE" });
    setConfirmDelete(null); refresh();
  };

  const handleSignOut = () => { signOut(); router.replace("/auth"); };

  if (!authChecked || loading) {
    return <div style={{ minHeight: "100vh", background: "#080f1a" }} />;
  }

  const upCount   = monitors.filter((m) => m.lastStatus === "up").length;
  const downCount = monitors.filter((m) => m.lastStatus === "down").length;
  const avgUptime = monitors.length === 0 ? null :
    (monitors.reduce((s, m) => s + (analytics[m.id] ? parseFloat(analytics[m.id].uptime) : 100), 0) / monitors.length).toFixed(1);
  const respondingMonitors = monitors.filter(m => m.lastResponseTime);
  const avgMs = respondingMonitors.length > 0
    ? Math.round(respondingMonitors.reduce((s, m) => s + (m.lastResponseTime || 0), 0) / respondingMonitors.length)
    : null;
  const activeIncidents = incidents.filter(inc => monitors.some(m => m.id === inc.monitorId));

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');`}</style>
      <div style={{ minHeight: "100vh", background: "#080f1a", color: "#dce6f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* Nav */}
        <nav className="nav-pad" style={{ background: "#050b14", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 48px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                stroke="#2e4a5e" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
              <path d="M9 12l2 2 4-4" stroke="#2e4a5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#2e4a5e", letterSpacing: "0.04em" }}>Sentinel</span>
          </Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#2e4a5e" }}>{timeAgo(lastRefresh.toISOString())}</span>
            <button onClick={refresh}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#4a6a80", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ↻
            </button>
            <button onClick={() => setShowForm((v) => !v)}
              style={{ background: showForm ? "transparent" : "#FF9900", border: showForm ? "1px solid rgba(255,255,255,0.06)" : "none", color: showForm ? "#4a6a80" : "#000", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {showForm ? "Cancel" : "+ Monitor"}
            </button>
            {/* Account avatar — obvious entry point to /account */}
            <Link href="/account" title={userEmail ?? "Account"}
              style={{ width: 30, height: 30, borderRadius: "50%", background: "#0c1520", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6a8fa8", letterSpacing: "0.04em" }}>
                {userEmail ? userEmail.slice(0, 2).toUpperCase() : "?"}
              </span>
            </Link>
          </div>
        </nav>

        <main className="page-pad" style={{ padding: "28px 48px 80px" }}>

          {/* Error banner */}
          {error && (
            <div style={{ borderLeft: "2px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.04)", borderRadius: "0 6px 6px 0", padding: "10px 14px 10px 16px", marginBottom: 20, color: "#8b949e", fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Active incidents */}
          {activeIncidents.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {activeIncidents.length} active incident{activeIncidents.length > 1 ? "s" : ""}
                </span>
              </div>
              {activeIncidents.map((inc) => {
                const mon = monitors.find((m) => m.id === inc.monitorId);
                return (
                  <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(239,68,68,0.1)", fontSize: 13 }}>
                    <span style={{ color: "#fca5a5", fontWeight: 500 }}>{mon?.name || inc.url}</span>
                    <span style={{ color: "#4a6a80" }}>since {timeAgo(inc.startTime)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add monitor form */}
          {showForm && (
            <div style={{ background: "#0c1520", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 22px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: 9, color: "#4a6a80", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700 }}>Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My API" style={INPUT} />
              </div>
              <div style={{ flex: "2 1 220px" }}>
                <label style={{ fontSize: 9, color: "#4a6a80", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700 }}>URL</label>
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com"
                  onKeyDown={(e) => e.key === "Enter" && addMonitor()} style={INPUT} />
              </div>
              <button onClick={addMonitor} disabled={formLoading}
                style={{ background: "#FF9900", border: "none", color: "#000", padding: "9px 22px", borderRadius: 7, cursor: formLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: formLoading ? 0.6 : 1 }}>
                {formLoading ? "Adding..." : "Add"}
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total",        value: monitors.length,                          accent: "rgba(255,255,255,0.06)", color: "#dce6f0" },
              { label: "Online",       value: upCount,                                  accent: upCount > 0 ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)", color: upCount > 0 ? "#22c55e" : "#dce6f0" },
              { label: "Down",         value: downCount,                                accent: downCount > 0 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)", color: downCount > 0 ? "#ef4444" : "#dce6f0" },
              { label: "Avg response", value: avgMs ? `${avgMs}ms` : "—",              accent: "rgba(255,255,255,0.06)", color: "#dce6f0" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#0c1520", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `2px solid ${c.accent}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 9, color: "#4a6a80", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 10 }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.color, letterSpacing: "-0.02em" }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Monitor list */}
          {monitors.length === 0 ? (
            <div style={{ background: "#0c1520", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 12, padding: "60px 24px", textAlign: "center", color: "#4a6a80", fontSize: 14 }}>
              No monitors yet. Add one to get started.
            </div>
          ) : (
            <>
              {/* Desktop column headers */}
              <div className="mon-table-head" style={{ display: "grid", gridTemplateColumns: "20px 1fr 140px 110px 90px 70px auto", alignItems: "center", gap: "0 16px", padding: "6px 18px", marginBottom: 6 }}>
                {["", "Monitor", "Uptime (24h)", "Response", "Status", "Checked", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 9, color: "#3d607a", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, textAlign: i >= 2 ? "right" : "left" }}>{h}</span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {monitors.map((m) => {
                  const a = analytics[m.id];
                  const isUp   = m.lastStatus === "up";
                  const isDown = m.lastStatus === "down";
                  const msColor = !m.lastResponseTime ? "#4a6a80"
                    : m.lastResponseTime < 500  ? "#22c55e"
                    : m.lastResponseTime < 2000 ? "#f59e0b"
                    : "#ef4444";
                  const deleteActions = confirmDelete === m.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => deleteMonitor(m.id)}
                        style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#9b7070", padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Remove
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#4a6a80", padding: "3px 7px", borderRadius: 5, cursor: "pointer", fontSize: 11 }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(m.id)}
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#3d607a", width: 28, height: 28, borderRadius: 5, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✕
                    </button>
                  );
                  return (
                    <div key={m.id} style={{ background: "#0c1520", border: `1px solid ${isDown ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)"}`, borderRadius: 10 }}>
                      {/* Desktop row */}
                      <div className="mon-cols" style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "20px 1fr 140px 110px 90px 70px auto", alignItems: "center", gap: "0 16px" }}>
                        <div style={{ width: 3, height: 14, borderRadius: 2, background: isUp ? "#22c55e" : isDown ? "#ef4444" : "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#dce6f0", marginBottom: 2 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "#3d607a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.url}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          {a ? <UptimeBar uptime={a.uptime} /> : <span style={{ fontSize: 12, color: "#3d607a" }}>—</span>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: msColor }}>
                            {m.lastResponseTime !== null ? `${m.lastResponseTime}ms` : "—"}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: isUp ? "#22c55e" : isDown ? "#ef4444" : "#3d607a" }}>
                            {m.lastStatus}
                          </span>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 11, color: "#3d607a" }}>{timeAgo(m.lastChecked)}</div>
                        {deleteActions}
                      </div>
                      {/* Mobile card */}
                      <div className="mon-mobile" style={{ display: "none", padding: "14px 16px", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 3, height: 14, borderRadius: 2, background: isUp ? "#22c55e" : isDown ? "#ef4444" : "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: "#dce6f0" }}>{m.name}</div>
                              <div style={{ fontSize: 10, color: "#3d607a", marginTop: 2 }}>{m.url}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: isUp ? "#22c55e" : isDown ? "#ef4444" : "#3d607a" }}>
                            {m.lastStatus}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 9, color: "#3d607a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Response</div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: msColor }}>{m.lastResponseTime !== null ? `${m.lastResponseTime}ms` : "—"}</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: "#3d607a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Checked</div>
                              <span style={{ fontSize: 12, color: "#4a6a80" }}>{timeAgo(m.lastChecked)}</span>
                            </div>
                            {a && <div>
                              <div style={{ fontSize: 9, color: "#3d607a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Uptime</div>
                              <UptimeBar uptime={a.uptime} />
                            </div>}
                          </div>
                          {deleteActions}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {avgUptime && (
                <div style={{ marginTop: 10, padding: "10px 18px", background: "#0c1520", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#3d607a" }}>{monitors.length} monitor{monitors.length !== 1 ? "s" : ""} · checks every 60s</span>
                  <span style={{ fontSize: 12, color: "#3d607a" }}>avg uptime <span style={{ color: "#22c55e", fontWeight: 600 }}>{avgUptime}%</span></span>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </>
  );
}
