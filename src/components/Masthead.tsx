/**
 * The ministry's own crest: cross + flame inside the "U" of YOUTH, standing
 * for the youth's burning spirit to glorify God, gathered as one body.
 * Finalized by the pengurus 16 Aug 2026 (see public/logo/BRAND-GUIDE_Youth-GKKK.md).
 */
export function Logomark({ className = "" }: { className?: string }) {
  return (
    // A 96 px raster of the crest (~8 KB) — every Logomark renders at
    // 48 px or less, so this is already 2x. The traced vector it replaces
    // was ~1 MB.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/crest-96.webp"
      alt=""
      width={96}
      height={129}
      decoding="async"
      className={`h-7 w-7 shrink-0 object-contain ${className}`}
      aria-hidden="true"
    />
  );
}
