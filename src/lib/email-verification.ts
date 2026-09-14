import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

const TOKEN_TTL_HOURS = 24;

export async function sendVerificationEmail(email: string) {
  // Oude, nog niet gebruikte tokens voor dit e-mailadres opruimen.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? ""}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Bevestig je e-mailadres — Shiftje",
    html: emailLayout(
      "Bevestig je e-mailadres",
      `
        <p>Klik op de knop hieronder om je e-mailadres te bevestigen en je Shiftje-account te activeren.</p>
        <p style="margin-top: 20px;">
          <a href="${verifyUrl}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
            E-mailadres bevestigen
          </a>
        </p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          Werkt de knop niet? Kopieer deze link: ${verifyUrl}<br />
          Deze link is ${TOKEN_TTL_HOURS} uur geldig.
        </p>
      `
    ),
  });
}
