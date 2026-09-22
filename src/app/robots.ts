import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Ingelogde omgeving en interne routes horen niet in de zoekresultaten.
        disallow: ["/dashboard", "/admin", "/api", "/invite", "/join", "/demo-switch"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
