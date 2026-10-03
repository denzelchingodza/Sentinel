import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Privacy · Sentinel",
  description: "What Sentinel stores and why.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "system-ui, -apple-system, sans-serif", color: "var(--cb)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');`}</style>

      {/* Nav */}
      <div style={{ padding: "0 48px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-nav)", borderBottom: "1px solid var(--bd-faint)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
              stroke="var(--clo)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(46,74,94,0.15)" />
            <path d="M9 12l2 2 4-4" stroke="var(--clo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 12, color: "var(--clo)", letterSpacing: "0.04em" }}>Sentinel</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle style={{ padding: "4px 8px", fontSize: 12, gap: 6, width: "auto" }} />
          <Link href="/" style={{ fontSize: 11, color: "var(--cd)", textDecoration: "none" }}>← Home</Link>
        </div>
      </div>

      <div style={{ maxWidth: 600, padding: "56px 48px 100px" }}>

        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400, letterSpacing: "-0.01em", color: "var(--ch)", margin: "0 0 12px", lineHeight: 1.1 }}>
          Privacy
        </h1>
        <p style={{ fontSize: 13, color: "var(--cb)", marginBottom: 52, lineHeight: 1.7 }}>
          Sentinel is a personal project, not a company. This page is just an honest explanation of what gets stored when you use it.
        </p>

        <Block title="What I store">
          Your email address and the URLs you add for monitoring. That is it. Check results — status codes, response times, timestamps — are stored in DynamoDB to power your dashboard history. I do not store anything about the content of your services.
        </Block>

        <Block title="Passwords">
          Your password is never stored by Sentinel directly. Authentication runs through Amazon Cognito, which handles all the hashing and security. I only see your user ID and email.
        </Block>

        <Block title="Alert emails">
          When a URL you are monitoring goes down or recovers, SES sends you an email. Your email address exists in the system for this reason only. Deleting your account removes it along with everything else.
        </Block>

        <Block title="Infrastructure">
          Everything runs on AWS in the af-south-1 (Cape Town) region — Lambda, DynamoDB, SES, Cognito, API Gateway, SQS, EventBridge. The frontend is hosted on Vercel. The infrastructure is provisioned with Terraform.
        </Block>

        <Block title="Analytics">
          Vercel may collect anonymised page view metrics. No cookies, no personal identifiers.
        </Block>

        <div style={{ borderTop: "1px solid var(--bd-faint)", margin: "40px 0" }} />

        <p style={{ fontSize: 13, color: "var(--cb)", lineHeight: 1.8 }}>
          Questions?{" "}
          <a href="mailto:denzel.chingodza@icloud.com"
            style={{ color: "var(--cs)", textDecoration: "none", borderBottom: "1px solid var(--bd)", paddingBottom: 1 }}>
            denzel.chingodza@icloud.com
          </a>
        </p>

      </div>

      <footer style={{ borderTop: "1px solid var(--bd-faint)", padding: "22px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 11, color: "var(--cd)" }}>2026 Denzel Chingodza</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/" style={{ fontSize: 11, color: "var(--cd)", textDecoration: "none" }}>Home</Link>
          <span style={{ fontSize: 11, color: "var(--cf)" }}>Serverless · af-south-1</span>
        </div>
      </footer>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cd)", marginBottom: 10 }}>{title}</div>
      <p style={{ fontSize: 13, color: "var(--cb)", lineHeight: 1.85, margin: 0 }}>{children}</p>
    </div>
  );
}
