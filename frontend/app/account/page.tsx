"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, signOut, signIn, changePassword, deleteAccount } from "../../lib/cognito";
import ThemeToggle from "../../components/ThemeToggle";

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--bd)",
  borderRadius: 7,
  color: "var(--ch)",
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  color: "var(--cd)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 700,
};

const CARD: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--bd)",
  borderRadius: 14,
  padding: "24px 26px",
  marginBottom: 12,
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail]         = useState<string | null>(null);
  const [authChecked, setAuth]    = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  // Change password
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [pwLoading, setPwLoading]     = useState(false);
  const [pwError, setPwError]         = useState<string | null>(null);
  const [pwSuccess, setPwSuccess]     = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep]     = useState<"idle" | "confirm">("idle");
  const [deletePw, setDeletePw]         = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]   = useState<string | null>(null);
  const [byeVisible, setByeVisible]     = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.replace("/auth"); return; }
      const payload = session.getIdToken().decodePayload();
      setEmail((payload.email as string) ?? null);
      // Cognito stores account creation in auth_time or iat (rough approximation)
      const iat = payload.iat as number | undefined;
      if (iat) {
        setMemberSince(new Date(iat * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      }
      setAuth(true);
    });
  }, [router]);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) return;
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    setPwLoading(true); setPwError(null); setPwSuccess(false);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true); setCurrentPw(""); setNewPw("");
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : "Failed to update password.");
    } finally { setPwLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw || !email) return;
    setDeleteLoading(true); setDeleteError(null);
    try {
      // Verify password first before wiping the account
      await signIn(email, deletePw);
      await deleteAccount();
      signOut();
      setByeVisible(true);
      setTimeout(() => router.replace("/"), 2800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete account.";
      setDeleteError(msg.includes("Incorrect") || msg.includes("password") ? "Incorrect password." : msg);
      setDeleteLoading(false);
    }
  };

  const initials = email ? email.split("@")[0].slice(0, 2).toUpperCase() : "??";

  if (!authChecked) return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');`}</style>

      {/* Bye overlay */}
      {byeVisible && (
        <div style={{ position: "fixed", inset: 0, background: "var(--bg)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 400, color: "var(--ch)", margin: 0 }}>Take care.</h1>
          <p style={{ fontSize: 13, color: "var(--cd)" }}>Your account has been deleted.</p>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ch)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* Nav */}
        <nav className="nav-pad" style={{ background: "var(--bg-nav)", borderBottom: "1px solid var(--bd-faint)", padding: "0 48px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                stroke="var(--cf)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
              <path d="M9 12l2 2 4-4" stroke="var(--cf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--clo)", letterSpacing: "0.04em" }}>Sentinel</span>
          </Link>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ThemeToggle style={{ padding: "4px 8px", fontSize: 12, gap: 6, width: "auto" }} />
            <Link href="/dashboard" style={{ fontSize: 12, color: "var(--cd)", textDecoration: "none" }}>Dashboard</Link>
            <button onClick={() => { signOut(); router.replace("/auth"); }}
              style={{ background: "transparent", border: "none", color: "var(--clo)", cursor: "pointer", fontSize: 12, padding: 0 }}>
              Sign out
            </button>
          </div>
        </nav>

        <main style={{ padding: "36px 48px 80px" }}>

          {/* Profile strip — full width */}
          <div className="account-strip" style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-input)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 15, color: "var(--cs)" }}>{initials}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ch)", marginBottom: 3 }}>{email}</div>
                {memberSince && <div style={{ fontSize: 11, color: "var(--cd)" }}>Member since {memberSince}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--cs)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--bd)", borderRadius: 20, padding: "3px 12px" }}>Personal</span>
              <span style={{ fontSize: 10, color: "var(--cd)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--bd-faint)", borderRadius: 20, padding: "3px 12px" }}>af-south-1</span>
            </div>
          </div>

          {/* Two-column grid */}
          <div className="account-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

            {/* LEFT — Change password */}
            <div style={CARD}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, fontWeight: 400, color: "var(--ch)", margin: "0 0 20px", lineHeight: 1.2 }}>
                Change password
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={LABEL}>Current password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="••••••••" style={{ ...INPUT, paddingRight: 38 }} />
                    <button onClick={() => setShowCurrent((v) => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                      <EyeIcon open={showCurrent} />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={LABEL}>New password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                      placeholder="••••••••" style={{ ...INPUT, paddingRight: 38 }}
                      onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
                    <button onClick={() => setShowNew((v) => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                      <EyeIcon open={showNew} />
                    </button>
                  </div>
                </div>
              </div>

              {pwError && (
                <div style={{ borderLeft: "2px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.04)", borderRadius: "0 6px 6px 0", padding: "9px 12px 9px 14px", marginTop: 14, fontSize: 13, color: "#9b7070" }}>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ borderLeft: "2px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.04)", borderRadius: "0 6px 6px 0", padding: "9px 12px 9px 14px", marginTop: 14, fontSize: 13, color: "#4a8a6a" }}>
                  Password updated.
                </div>
              )}

              <button onClick={handleChangePassword} disabled={pwLoading || !currentPw || !newPw}
                style={{ marginTop: 18, background: "#FF9900", border: "none", color: "#000", padding: "10px 24px", borderRadius: 7, cursor: (pwLoading || !currentPw || !newPw) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: (pwLoading || !currentPw || !newPw) ? 0.5 : 1 }}>
                {pwLoading ? "Updating..." : "Update password"}
              </button>
            </div>

            {/* RIGHT — Preferences (coming soon) */}
            <div style={CARD}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, fontWeight: 400, color: "var(--ch)", margin: "0 0 4px", lineHeight: 1.2 }}>
                Preferences
              </h2>
              <span style={{ fontSize: 10, color: "var(--cd)", letterSpacing: "0.06em", display: "block", marginBottom: 18 }}>coming soon</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Alert threshold", desc: "Set how many failures before you get emailed." },
                  { label: "Notification windows", desc: "Silence alerts during specific hours." },
                  { label: "AI digest", desc: "Weekly plain-language summary of your uptime and trends." },
                  { label: "Smart alerting", desc: "Let the AI suppress noise and surface what actually matters." },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--bd-faint)" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(74,106,128,0.4)", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cs)", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--clo)", lineHeight: 1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* end grid */}

          {/* Delete account */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--bd-faint)" }}>
            <div style={{ fontSize: 9, color: "var(--clo)", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 14 }}>Danger zone</div>

            {deleteStep === "idle" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--cs)", marginBottom: 3 }}>Delete account</div>
                  <div style={{ fontSize: 11, color: "var(--clo)", lineHeight: 1.6 }}>Permanently removes your account, all monitors, and all data.</div>
                </div>
                <button onClick={() => { setDeleteStep("confirm"); setDeleteError(null); }}
                  style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.15)", color: "#6b4444", padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Delete account
                </button>
              </div>
            ) : (
              <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, color: "var(--cb)", marginBottom: 16, lineHeight: 1.6 }}>
                  This cannot be undone. Enter your password to confirm.
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={LABEL}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showDeletePw ? "text" : "password"} value={deletePw}
                      onChange={(e) => setDeletePw(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
                      placeholder="••••••••"
                      style={{ ...INPUT, paddingRight: 38, borderColor: "rgba(239,68,68,0.15)" }} />
                    <button onClick={() => setShowDeletePw((v) => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                      <EyeIcon open={showDeletePw} />
                    </button>
                  </div>
                </div>
                {deleteError && (
                  <div style={{ fontSize: 12, color: "#9b7070", marginBottom: 12 }}>{deleteError}</div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setDeleteStep("idle"); setDeleteError(null); setDeletePw(""); }}
                    style={{ background: "#FF9900", border: "none", color: "#000", padding: "8px 18px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Cancel
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleteLoading || !deletePw}
                    style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#9b7070", padding: "8px 16px", borderRadius: 7, cursor: (deleteLoading || !deletePw) ? "not-allowed" : "pointer", fontSize: 12, opacity: (deleteLoading || !deletePw) ? 0.5 : 1 }}>
                    {deleteLoading ? "Deleting..." : "Delete my account"}
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  );
}
