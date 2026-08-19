import { getWhatsAppAction } from "@/lib/phone";

type WhatsAppButtonProps = {
  number: string | null | undefined;
  name: string;
  className?: string;
};

/**
 * Link "Chat via WhatsApp" with Nocturne styling.
 */
export default function WhatsAppButton({ number, name, className }: WhatsAppButtonProps) {
  const action = getWhatsAppAction(number, name);
  if (!action) return null;
  return (
    <a
      className={
        className ??
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-sage/40 bg-sage-wash/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-sage transition-all duration-200 hover:border-sage hover:bg-sage-wash hover:shadow-[0_0_16px_rgba(123,160,108,0.25)]"
      }
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={action.label}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        className="shrink-0"
      >
        <path d="M12.04 2a9.9 9.9 0 0 0-8.54 14.9L2 22l5.24-1.37A9.9 9.9 0 1 0 12.04 2Zm0 1.67a8.23 8.23 0 1 1-4.16 15.33l-.3-.18-3.11.81.83-3.03-.2-.31a8.23 8.23 0 0 1 6.94-12.62Zm-3.2 4.05c-.17 0-.45.06-.68.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.78 2.84 4.4 3.87 2.18.86 2.62.69 3.1.65.47-.04 1.52-.62 1.73-1.22.22-.6.22-1.11.15-1.22-.07-.1-.24-.17-.5-.3-.26-.12-1.52-.75-1.75-.84-.24-.08-.41-.12-.58.13-.17.26-.66.84-.81 1.01-.15.17-.3.2-.55.07-.26-.13-1.1-.4-2.08-1.28a7.6 7.6 0 0 1-1.44-1.8c-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.08-.17.04-.32-.02-.45-.07-.13-.57-1.4-.8-1.92-.2-.5-.42-.45-.57-.46h-.51Z" />
      </svg>
      Hubungi via WhatsApp
    </a>
  );
}
