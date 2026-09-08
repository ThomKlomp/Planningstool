/**
 * Maakt een bestaande gebruiker platform-admin (toegang tot /admin).
 * De gebruiker moet eerst minstens één keer ingelogd zijn met Google,
 * zodat er al een User-record bestaat.
 *
 * Gebruik:
 *   npm run db:seed -- jouw@email.nl
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Gebruik: npm run db:seed -- jouw@email.nl");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `Geen user gevonden met e-mail ${email}. Log eerst één keer in via de app.`
    );
    process.exit(1);
  }

  await prisma.platformAdmin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`${email} is nu platform-admin.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
