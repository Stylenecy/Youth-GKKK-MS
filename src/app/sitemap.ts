import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the public bulletin. Dashboard routes hold member data.
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
