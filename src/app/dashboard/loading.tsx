import { RouteLoading } from "@/components/RouteStates";

/**
 * Loading state for every dashboard page that has no loading.tsx of its own
 * (anggota, Cross, ibadah, rapat, pengaturan, audit, beranda): the page
 * header plus a few neutral placeholder rows, instead of a blank screen
 * while the database answers.
 */
export default function Loading() {
  return <RouteLoading title="Memuat halaman pengurus" />;
}
