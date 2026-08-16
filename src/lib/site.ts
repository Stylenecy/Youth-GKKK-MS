/**
 * Canonical origin of the deployed site.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment, so preview
 * builds still generate correct absolute URLs without hardcoding anything.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const SITE_NAME = "Space Youth GKKK";
export const SITE_TAGLINE = "Komisi Pemuda GKKK Yogyakarta";
