"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "../../components/ThemeToggle";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signIn, signUp, confirmSignUp,
  forgotPassword, confirmForgotPassword,
  getSession,
} from "../../lib/cognito";

type Screen = "signin" | "signup" | "confirm" | "forgot" | "reset";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--bd)",
  borderRadius: 7,
  color: "var(--cin)",
  padding: "10px 13px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: "var(--cf)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontWeight: 700,
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  background: "#FF9900",
  border: "none",
  color: "#000",
  padding: "11px",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  marginTop: 8,
};

const REMEMBERED_EMAIL_KEY = "sentinel_last_email";

export default function AuthPage() {
  const router = useRouter();
  const [screen, setScreen]           = useState<Screen>("signin");
  const [email, setEmail]             = useState(() => {
    try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ""; }
    catch { return ""; }
  });
  const [password, setPassword]       = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [resetCode, setResetCode]     = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showNewPw, setShowNewPw]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [info, setInfo]               = useState<string | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (s) { setRedirecting(true); router.replace("/dashboard"); }
      else setSessionChecked(true);
    });
  }, [router]);

  function friendlyError(err: unknown): string {
    if (err && typeof err === "object" && "message" in err) {
      const msg = (err as { message: string }).message;
      if (msg.includes("User does not exist") || msg.includes("Incorrect username or password"))
        return "Incorrect email or password.";
      if (msg.includes("User is not confirmed"))
        return "Please confirm your email before signing in.";
      if (msg.includes("UsernameExistsException"))
        return "An account with this email already exists.";
      if (msg.includes("InvalidPasswordException") || msg.includes("Password did not conform"))
        return "Password must be at least 8 characters and include a number.";
      if (msg.includes("CodeMismatchException") || msg.includes("Invalid verification code"))
        return "That code is incorrect. Check your email and try again.";
      if (msg.includes("ExpiredCodeException"))
        return "That code has expired. Request a new one.";
      if (msg.includes("LimitExceededException"))
        return "Too many attempts. Please wait a few minutes and try again.";
      if (msg.includes("UserNotFoundException"))
        return "No account found with that email address.";
      return msg;
    }
    return "Something went wrong. Please try again.";
  }

  function rememberEmail(e: string) {
    try { localStorage.setItem(REMEMBERED_EMAIL_KEY, e); } catch { /* ignore */ }
  }

  async function handleSignIn() {
    setLoading(true); setError(null);
    try {
      await signIn(email, password);
      rememberEmail(email);
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) { setError(friendlyError(err)); setLoading(false); }
  }

  async function handleSignUp() {
    setLoading(true); setError(null);
    try {
      await signUp(email, password);
      setInfo("Check your inbox for a 6-digit verification code.");
      setScreen("confirm");
    } catch (err) { setError(friendlyError(err)); }
    finally { setLoading(false); }
  }

  async function handleConfirm() {
    setLoading(true); setError(null);
    try {
      await confirmSignUp(email, confirmCode);
      await signIn(email, password);
      rememberEmail(email);
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) { setError(friendlyError(err)); setLoading(false); }
  }

  async function handleForgot() {
    setLoading(true); setError(null);
    try {
      await forgotPassword(email);
      setInfo(`Reset code sent to ${email}`);
      setScreen("reset");
    } catch (err) { setError(friendlyError(err)); }
    finally { setLoading(false); }
  }

  async function handleReset() {
    setLoading(true); setError(null);
    try {
      await confirmForgotPassword(email, resetCode, newPassword);
      await signIn(email, newPassword);
      rememberEmail(email);
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) { setError(friendlyError(err)); setLoading(false); }
  }

  const onKey = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
  };

  if (redirecting || !sessionChecked) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  return (
    <div className="auth-grid" style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* LEFT — context */}
      <div className="auth-left" style={{ padding: "48px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid var(--bd-faint)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                stroke="var(--cf)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
              <path d="M9 12l2 2 4-4" stroke="var(--cf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--cf)", letterSpacing: "0.04em" }}>Sentinel</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle style={{ padding: "4px 8px", fontSize: 11, gap: 5, width: "auto" }} />
            <Link href="/" style={{ fontSize: 11, color: "var(--cf)", textDecoration: "none" }}>Home</Link>
          </div>
        </div>

        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 400, color: "var(--ch)", lineHeight: 1.15, letterSpacing: "-0.01em", margin: "0 0 16px" }}>
            URL monitoring<br />on AWS.
          </h1>
          <p style={{ fontSize: 13, color: "var(--clo)", lineHeight: 1.8, margin: 0, maxWidth: 320 }}>
            Checks your URLs every 60 seconds. Emails you when something goes down, and again when it recovers.
          </p>
        </div>

        <span style={{ fontSize: 11, color: "var(--cf)" }}>af-south-1 · Serverless</span>
      </div>

      {/* RIGHT — form */}
      <div className="auth-right" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px" }}>
        {/* Mobile-only header */}
        <div style={{ display: "none" }} className="auth-mobile-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                  stroke="var(--cf)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
                <path d="M9 12l2 2 4-4" stroke="var(--cf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontWeight: 600, fontSize: 12, color: "var(--cf)", letterSpacing: "0.04em" }}>Sentinel</span>
            </div>
            <Link href="/" style={{ fontSize: 11, color: "var(--cf)", textDecoration: "none" }}>Home</Link>
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ch)", marginBottom: 24 }}>
            {screen === "signin"  ? "Sign in"           :
             screen === "signup"  ? "Create account"    :
             screen === "confirm" ? "Verify your email" :
             screen === "forgot"  ? "Reset password"    :
                                    "Set new password"}
          </h2>

          {error && (
            <div style={{ borderLeft: "2px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.04)", borderRadius: "0 6px 6px 0", padding: "9px 12px 9px 14px", marginBottom: 16, fontSize: 13, color: "#8b949e" }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ borderLeft: "2px solid rgba(74,158,255,0.35)", background: "rgba(74,158,255,0.03)", borderRadius: "0 6px 6px 0", padding: "9px 12px 9px 14px", marginBottom: 16, fontSize: 13, color: "#8b949e" }}>
              {info}
            </div>
          )}

          {screen === "signin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleSignIn)} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <button onClick={() => { setScreen("forgot"); setError(null); setInfo(null); }}
                    style={{ background: "none", border: "none", color: "var(--clo)", cursor: "pointer", fontSize: 11, padding: 0 }}>
                    Forgot?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" style={{ ...inputStyle, paddingRight: 38 }}
                    onKeyDown={(e) => onKey(e, handleSignIn)} />
                  <button onClick={() => setShowPw(p => !p)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button onClick={handleSignIn} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          )}

          {screen === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleSignUp)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, include a number" style={{ ...inputStyle, paddingRight: 38 }}
                    onKeyDown={(e) => onKey(e, handleSignUp)} />
                  <button onClick={() => setShowPw(p => !p)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button onClick={handleSignUp} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          )}

          {screen === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Verification code</label>
                <input type="text" value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="123456" style={{ ...inputStyle, letterSpacing: "0.2em", fontSize: 18 }}
                  onKeyDown={(e) => onKey(e, handleConfirm)} />
              </div>
              <button onClick={handleConfirm} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </button>
            </div>
          )}

          {screen === "forgot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleForgot)} />
              </div>
              <button onClick={handleForgot} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Sending..." : "Send reset code"}
              </button>
              <button onClick={() => { setScreen("signin"); setError(null); setInfo(null); }}
                style={{ background: "transparent", border: "none", color: "var(--cf)", cursor: "pointer", fontSize: 12, marginTop: 2 }}>
                Back to sign in
              </button>
            </div>
          )}

          {screen === "reset" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Reset code</label>
                <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456" style={{ ...inputStyle, letterSpacing: "0.2em", fontSize: 18 }}
                  onKeyDown={(e) => onKey(e, handleReset)} />
              </div>
              <div>
                <label style={labelStyle}>New password</label>
                <div style={{ position: "relative" }}>
                  <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, include a number" style={{ ...inputStyle, paddingRight: 38 }}
                    onKeyDown={(e) => onKey(e, handleReset)} />
                  <button onClick={() => setShowNewPw(p => !p)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--clo)", display: "flex" }}>
                    {showNewPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button onClick={handleReset} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting..." : "Set new password"}
              </button>
            </div>
          )}

          {(screen === "signin" || screen === "signup") && (
            <p style={{ fontSize: 12, color: "var(--cf)", marginTop: 20 }}>
              {screen === "signin" ? "No account? " : "Already have one? "}
              <button
                onClick={() => { setScreen(screen === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
                style={{ background: "none", border: "none", color: "var(--cd)", cursor: "pointer", fontSize: 12, fontWeight: 500, padding: 0 }}>
                {screen === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        @media (max-width: 900px) {
          .auth-mobile-header { display: block !important; }
        }
      `}</style>
    </div>
  );
}
