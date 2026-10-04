import { RouteLoading } from "@/components/RouteStates";

/**
 * Loading state for every dashboard page that has no loading.tsx of its own
 * (anggota, Cross, ibadah, rapat, pengaturan, audit, beranda): a skeleton in
 * the page's shape instead of a blank screen while the database answers.
 */
export default function Loading() {
  return <RouteLoading title="Memuat halaman pengurus" />;
}
