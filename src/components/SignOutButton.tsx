import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

/**
 * Keluar dari sesi Google. Dipakai di layar Menunggu Persetujuan (akun
 * pending/ditolak tidak punya UI lain untuk keluar) dan di Pengaturan.
 */
async function signOut() {
  "use server";
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export function SignOutButton({ label = "Keluar dari akun ini" }: { label?: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="btn-outline w-full justify-center text-sm"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
