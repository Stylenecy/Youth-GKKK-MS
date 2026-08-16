import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard is behind auth once Supabase is connected, and holds
      // member data either way. Keep it out of search results.
      disallow: ["/dashboard", "/dashboard/", "/login", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
