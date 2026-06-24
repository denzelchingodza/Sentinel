"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signIn, signUp, confirmSignUp,
  forgotPassword, confirmForgotPassword,
  getSession,
} from "../../lib/cognito";

type Screen = "signin" | "signup" | "confirm" | "forgot" | "reset";

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(74,158,255,0.08)" />
      <path d="M9 12l2 2 4-4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#14161c",
  border: "1px solid #2a2f38",
  borderRadius: 7,
  color: "#e6edf3",
  padding: "10px 13px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#6e7681",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  background: "#4a9eff",
  border: "none",
  color: "#fff",
  padding: "11px",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  marginTop: 8,
};

export default function AuthPage() {
  const router = useRouter();
  const [screen, setScreen]           = useState<Screen>("signin");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [resetCode, setResetCode]     = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading]         = useState(false);
  const [redirecting, setRedirecting] = useState(false); // hides UI during navigation
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [info, setInfo]               = useState<string | null>(null);

  // If already logged in, redirect immediately and stay blank
  useEffect(() => {
    getSession().then((s) => {
      if (s) {
        setRedirecting(true);
        router.replace("/dashboard");
      } else {
        setSessionChecked(true);
      }
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

  async function handleSignIn() {
    setLoading(true); setError(null);
    try {
      await signIn(email, password);
      // Blank the page immediately — no flash between auth and dashboard
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true); setError(null);
    try {
      await signUp(email, password);
      setInfo("Check your inbox — we sent a 6-digit verification code.");
      setScreen("confirm");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true); setError(null);
    try {
      await confirmSignUp(email, confirmCode);
      await signIn(email, password);
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  }

  async function handleForgot() {
    setLoading(true); setError(null);
    try {
      await forgotPassword(email);
      setInfo(`Reset code sent to ${email}`);
      setScreen("reset");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true); setError(null);
    try {
      await confirmForgotPassword(email, resetCode, newPassword);
      setInfo("Password updated. Signing you in…");
      await signIn(email, newPassword);
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  }

  const onKey = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
  };

  // Blank screen while navigating or waiting for session check — prevents any flash
  if (redirecting || !sessionChecked) {
    return <div style={{ minHeight: "100vh", background: "#181b21" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#181b21", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <ShieldIcon />
          <span style={{ fontWeight: 700, fontSize: 20, color: "#e6edf3" }}>Sentinel</span>
        </div>

        {/* Card */}
        <div style={{ background: "#1e2228", border: "1px solid #2a2f38", borderRadius: 12, padding: "28px 28px 24px" }}>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", marginBottom: 4 }}>
            {screen === "signin"  ? "Sign in"             :
             screen === "signup"  ? "Create account"      :
             screen === "confirm" ? "Verify your email"   :
             screen === "forgot"  ? "Reset password"      :
                                    "Set new password"}
          </h2>
          <p style={{ fontSize: 13, color: "#4d5562", marginBottom: 24 }}>
            {screen === "signin"  ? "Welcome back."                              :
             screen === "signup"  ? "Get started — it's free."                  :
             screen === "confirm" ? `Code sent to ${email}`                     :
             screen === "forgot"  ? "Enter your email and we'll send a code."   :
                                    `Code sent to ${email}`}
          </p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, padding: "9px 12px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{ background: "rgba(74,158,255,0.07)", border: "1px solid rgba(74,158,255,0.2)", borderRadius: 7, padding: "9px 12px", marginBottom: 16, fontSize: 13, color: "#93c5fd" }}>
              {info}
            </div>
          )}

          {/* ── Sign in ── */}
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
                    style={{ background: "none", border: "none", color: "#4a9eff", cursor: "pointer", fontSize: 12, padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleSignIn)} />
              </div>
              <button onClick={handleSignIn} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          )}

          {/* ── Sign up ── */}
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, include a number" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleSignUp)} />
              </div>
              <button onClick={handleSignUp} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </div>
          )}

          {/* ── Confirm email ── */}
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
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
            </div>
          )}

          {/* ── Forgot password — enter email ── */}
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
                {loading ? "Sending…" : "Send reset code"}
              </button>
              <button onClick={() => { setScreen("signin"); setError(null); setInfo(null); }}
                style={{ background: "transparent", border: "none", color: "#4d5562", cursor: "pointer", fontSize: 13, marginTop: 2 }}>
                ← Back to sign in
              </button>
            </div>
          )}

          {/* ── Reset password — enter code + new password ── */}
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
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, include a number" style={inputStyle}
                  onKeyDown={(e) => onKey(e, handleReset)} />
              </div>
              <button onClick={handleReset} disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting…" : "Set new password"}
              </button>
            </div>
          )}
        </div>

        {/* Toggle sign in / sign up */}
        {(screen === "signin" || screen === "signup") && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#4d5562", marginTop: 18 }}>
            {screen === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setScreen(screen === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
              style={{ background: "none", border: "none", color: "#4a9eff", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }}>
              {screen === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
