import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/",                              changefreq: "weekly",  priority: "1.0" },
          { path: "/features",                      changefreq: "monthly", priority: "0.9" },
          { path: "/pricing",                       changefreq: "monthly", priority: "0.9" },
          { path: "/courses",                       changefreq: "weekly",  priority: "0.8" },
          { path: "/ai-learning",                   changefreq: "monthly", priority: "0.8" },
          { path: "/schools",                       changefreq: "monthly", priority: "0.8" },
          { path: "/about",                         changefreq: "monthly", priority: "0.6" },
          { path: "/blog",                          changefreq: "weekly",  priority: "0.6" },
          { path: "/contact",                       changefreq: "yearly",  priority: "0.5" },
          { path: "/demo",                          changefreq: "monthly", priority: "0.6" },
          { path: "/product/ai-tutor",              changefreq: "monthly", priority: "0.7" },
          { path: "/product/study-path",            changefreq: "monthly", priority: "0.7" },
          { path: "/product/test-engine",           changefreq: "monthly", priority: "0.7" },
          { path: "/product/analytics",             changefreq: "monthly", priority: "0.7" },
          { path: "/product/progress-tracking",     changefreq: "monthly", priority: "0.7" },
          { path: "/product/personalized-learning", changefreq: "monthly", priority: "0.7" },
          { path: "/product/student-dashboard",     changefreq: "monthly", priority: "0.7" },
          { path: "/product/parent-dashboard",      changefreq: "monthly", priority: "0.7" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
