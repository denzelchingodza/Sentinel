import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentinel",
    short_name: "Sentinel",
    description: "URL monitoring on AWS. Checks every 60 seconds.",
    start_url: "/",
    display: "standalone",
    background_color: "#080f1a",
    theme_color: "#080f1a",
    icons: [
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "any" },
    ],
  };
}
