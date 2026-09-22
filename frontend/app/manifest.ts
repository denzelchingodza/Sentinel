import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentinel — Uptime Monitoring",
    short_name: "Sentinel",
    description: "Serverless uptime monitoring and incident alerting.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#4a9eff",
    icons: [
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "any" },
    ],
  };
}
