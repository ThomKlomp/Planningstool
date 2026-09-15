import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || "Shiftje <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  bcc,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string | string[];
  from?: string;
}) {
  if (!resend) {
    // Geen RESEND_API_KEY ingesteld: log het in plaats van te versturen,
    // zodat lokaal ontwikkelen zonder e-mailservice gewoon blijft werken.
    console.log(`[email] RESEND_API_KEY ontbreekt, e-mail niet verstuurd naar ${to}: ${subject}`);
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: from || FROM,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(bcc ? { bcc } : {}),
  });
  return result;
}

/** Simpele, consistente wrapper zodat alle e-mails er hetzelfde uitzien. */
export function emailLayout(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #1B1B18; margin-bottom: 8px;">${title}</h1>
      <div style="color: #1B1B18; font-size: 14px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <p style="margin-top: 32px; font-size: 12px; color: #999;">
        Verstuurd via Shiftje.
      </p>
    </div>
  `;
}

/** Wrapper zonder de max-width van 480px, voor content die breder moet
 * zijn dan een normale tekst-e-mail (bv. een roostertabel met veel kolommen). */
export function emailLayoutWide(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #1B1B18; margin-bottom: 8px;">${title}</h1>
      <div style="color: #1B1B18; font-size: 13px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <p style="margin-top: 32px; font-size: 12px; color: #999;">
        Verstuurd via Shiftje.
      </p>
    </div>
  `;
}
