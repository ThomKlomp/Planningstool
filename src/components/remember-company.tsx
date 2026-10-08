"use client";

import { useEffect } from "react";

// Onthoudt de laatst gebruikte zaak in een cookie, zodat de homepage iemand
// zonder geldige sessie naar de inlogpagina van die zaak kan sturen
// (zie src/middleware.ts). Bevat alleen de (openbare) slug van de zaak.
export default function RememberCompany({ slug }: { slug: string }) {
  useEffect(() => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `shiftje_zaak=${encodeURIComponent(slug)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  }, [slug]);
  return null;
}
