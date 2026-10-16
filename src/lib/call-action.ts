/**
 * Server actions report a refusal by *returning* `{ success: false, … }`,
 * but they can also *throw*: the phone lost signal, the deployment changed
 * under an open tab, the function timed out. Thrown inside a transition,
 * that error escaped to the route's error screen and wiped the form — or,
 * in the attendance list, left a row stuck on "menyimpan…" forever.
 *
 * Every client call goes through this, so a throw becomes the same failed
 * result the component already knows how to show: `error` for components
 * that render one message, `errors.form` for the forms.
 */
export const NETWORK_ERROR =
  "Belum tersimpan karena koneksi terputus. Periksa internet, lalu coba lagi.";

export async function callAction<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error("[aksi]", err);
    // Shaped like every action's failure branch; the success-only fields
    // (id, count) are simply absent, as they are on any other failure.
    return {
      success: false,
      error: NETWORK_ERROR,
      errors: { form: [NETWORK_ERROR] },
    } as unknown as T;
  }
}
