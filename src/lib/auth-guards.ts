import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Stuurt door naar de verplichte acceptatiepagina als deze sessie de
 * algemene voorwaarden + het privacybeleid nog niet heeft geaccepteerd.
 * Aanroepen direct ná het ophalen van de sessie, vóórdat er iets van de app
 * getoond wordt (dashboard, admin, onboarding, een uitnodiging accepteren).
 * `path` is waar de gebruiker na acceptatie weer moet uitkomen.
 */
export function requireAcceptedTerms(session: Session, path: string) {
  if (!session.user.hasAcceptedTerms) {
    redirect(`/accept-terms?callbackUrl=${encodeURIComponent(path)}`);
  }
}
