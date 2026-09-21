"use client";

/**
 * Opent het chat-bolletje (rechtsonder), optioneel met een voorgevulde
 * tekst. Gebruikt op de homepage voor "Neem contact op".
 */
export default function ContactButton({
  message,
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("shiftje:open-chat", { detail: { message } }))
      }
      className={className}
    >
      {children}
    </button>
  );
}
