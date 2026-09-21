import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Staat toe dat iemand met Google inlogt op een e-mailadres dat al
      // een account heeft (bv. aangemaakt met wachtwoord), zonder dat
      // NextAuth dit blokkeert met "OAuthAccountNotLinked". Dit is veilig
      // omdat Google zelf al garandeert dat het e-mailadres geverifieerd
      // en van deze persoon is, er is dus geen risico dat iemand anders
      // met een willekeurig Google-account een bestaand account overneemt.
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "E-mail",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  // Credentials-login werkt in NextAuth alleen met JWT-sessies, niet met
  // database-sessies. We slaan daarom alleen de user-id in de JWT op, en
  // vragen bij elke request de actuele memberships/platform-admin-status
  // vers uit de database op in de session-callback hieronder — zo blijft
  // een rolwijziging (bv. via het adminportaal) direct zichtbaar, ook al
  // gebruiken we JWT-sessies.
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = token.id as string | undefined;
      if (session.user && userId) {
        session.user.id = userId;

        const platformAdmin = await prisma.platformAdmin.findUnique({
          where: { userId },
        });
        session.user.isPlatformAdmin = Boolean(platformAdmin);

        const memberships = await prisma.membership.findMany({
          where: { userId },
          include: { company: true },
        });
        session.user.memberships = memberships.map((m) => ({
          membershipId: m.id,
          companyId: m.companyId,
          companyName: m.company.name,
          companySlug: m.company.slug,
          role: m.role,
        }));
      }
      return session;
    },
  },
};
