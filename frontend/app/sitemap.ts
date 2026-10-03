import type { MetadataRoute } from "next";

const SITE_URL = "https://sentinel-kappa-wine.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                  lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/auth`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.8 },
    { url: `${SITE_URL}/privacy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
  ];
}
