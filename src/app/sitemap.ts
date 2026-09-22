import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/onboarding", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/signin", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
