import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Check of deze user platform-admin is (voor het interne admin-portaal).
        const platformAdmin = await prisma.platformAdmin.findUnique({
          where: { userId: user.id },
        });
        session.user.isPlatformAdmin = Boolean(platformAdmin);

        // Haal alle memberships (bedrijf + rol) op zodat we die overal kunnen gebruiken
        // zonder telkens opnieuw te query'en.
        const memberships = await prisma.membership.findMany({
          where: { userId: user.id },
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
