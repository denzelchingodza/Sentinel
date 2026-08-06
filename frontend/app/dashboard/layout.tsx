import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Monitor your services, view uptime history, and manage incidents.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
