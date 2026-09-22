import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Sentinel — how we handle your monitoring data.",
};

const BLUE = "#4a9eff";
const BG = "#0f1117";
const TEXT = "#e6edf3";
const SUB = "#6e7681";
const DIM = "#3d4450";
const BORDER = "#1a1f29";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-geist-sans), system-ui, sans-serif", color: TEXT }}>

      {/* Nav */}
      <nav
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 40px", borderBottom: `1px solid ${BORDER}`,
          background: "#0b0d13",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
              stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" fill="rgba(74,158,255,0.08)" />
            <path d="M9 12l2 2 4-4" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Sentinel</span>
        </div>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase",
            color: SUB, textDecoration: "none",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "64px 32px 100px" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: BLUE, opacity: 0.6, marginBottom: 14 }}>
          Legal
        </p>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 12, color: DIM, marginBottom: 52 }}>Last updated: September 2026</p>

        <Section title="Overview">
          Sentinel monitors your service URLs and sends email alerts when they go down or recover.
          We collect the minimum data necessary to make this work and do not share or sell anything.
        </Section>

        <Section title="Data we store">
          When you create an account, we store your email address and the URLs you add for monitoring.
          Uptime check results (status codes, response times, timestamps) are stored in DynamoDB to
          power your dashboard history. We do not store the content of your services.
        </Section>

        <Section title="Authentication">
          Accounts are managed via Amazon Cognito. Your password is never stored by Sentinel — Cognito
          handles hashing and security. We store only your Cognito user ID and email.
        </Section>

        <Section title="Alerting">
          Alert emails are sent via Amazon SES when a monitored URL changes status (down or recovered).
          We store your email address solely for this purpose. You can delete your account at any time
          to stop all alerts and remove your data.
        </Section>

        <Section title="Analytics">
          This site may use Vercel Analytics to collect anonymised page view and performance metrics.
          No cookies are used. No personal identifiers are collected. Vercel&apos;s{" "}
          <A href="https://vercel.com/legal/privacy-policy">privacy policy</A> governs this data.
        </Section>

        <Section title="Third-party services">
          <ul style={{ paddingLeft: 20, lineHeight: 2.1, color: SUB, fontSize: 14 }}>
            <li><strong style={{ color: "#a8b3c1" }}>Amazon Cognito</strong> — user authentication</li>
            <li><strong style={{ color: "#a8b3c1" }}>Amazon DynamoDB</strong> — storing monitors and check results</li>
            <li><strong style={{ color: "#a8b3c1" }}>Amazon SES</strong> — sending alert emails</li>
            <li><strong style={{ color: "#a8b3c1" }}>AWS Lambda</strong> — running uptime checks</li>
            <li><strong style={{ color: "#a8b3c1" }}>Vercel</strong> — hosting the frontend</li>
          </ul>
        </Section>

        <Section title="Data retention">
          Your account data, monitors, and check history are retained while your account exists.
          Deleting your account removes all associated data. We do not retain backups of user data
          beyond our hosting provider&apos;s standard retention windows.
        </Section>

        <div style={{ borderTop: `1px solid ${BORDER}`, margin: "40px 0" }} />

        <Section title="Contact">
          Questions about this policy?{" "}
          <A href="mailto:denzel.chingodza@icloud.com">denzel.chingodza@icloud.com</A>
        </Section>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${BORDER}`, background: "#0b0d13",
          padding: "18px 40px", display: "flex", justifyContent: "space-between",
          alignItems: "center", fontSize: 12, color: DIM,
        }}
      >
        <span>© 2026 Denzel Chingodza</span>
        <Link href="/" style={{ color: DIM, textDecoration: "none", fontSize: 12 }}>Sentinel</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: DIM, marginBottom: 10, fontWeight: 600 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: SUB, lineHeight: 1.85 }}>{children}</div>
    </div>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: BLUE, textDecoration: "none", borderBottom: "1px solid rgba(74,158,255,0.3)", paddingBottom: 1 }}>
      {children}
    </a>
  );
}
