import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const DEMO_SLUG = "demo";
const DEMO_PASSWORD = "Demo1234!";

const DEMO_PEOPLE = [
  { email: "eigenaar@demo.shiftje.nl", name: "Sanne de Vries", role: "OWNER" as const, dept: null as string | null },
  { email: "manager@demo.shiftje.nl", name: "Mark Jansen", role: "MANAGER" as const, dept: "Bediening" },
  { email: "julia@demo.shiftje.nl", name: "Julia Bakker", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "tom@demo.shiftje.nl", name: "Tom Visser", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "nina@demo.shiftje.nl", name: "Nina de Boer", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "ahmed@demo.shiftje.nl", name: "Ahmed El Idrissi", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "lotte@demo.shiftje.nl", name: "Lotte Smit", role: "EMPLOYEE" as const, dept: "Keuken" },
];

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function POST() {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // ---------- 1. Zaak zelf: aanmaken of opschonen ----------
  let company = await prisma.company.findUnique({ where: { slug: DEMO_SLUG } });

  if (company) {
    // Alles wat bij deze zaak hoort wissen, in de juiste volgorde i.v.m.
    // foreign keys. De Company-rij en de User-accounts blijven bestaan
    // (die worden hieronder geüpsert), zodat inlogsessies en de link naar
    // /join/demo stabiel blijven tussen resets door.
    await prisma.notification.deleteMany({ where: { companyId: company.id } });
    await prisma.shiftSwapRequest.deleteMany({ where: { companyId: company.id } });
    await prisma.timeEntry.deleteMany({ where: { companyId: company.id } });
    await prisma.shift.deleteMany({ where: { companyId: company.id } });
    await prisma.availability.deleteMany({ where: { membership: { companyId: company.id } } });
    await prisma.weekStatus.deleteMany({ where: { companyId: company.id } });
    await prisma.closedDay.deleteMany({ where: { companyId: company.id } });
    await prisma.invite.deleteMany({ where: { companyId: company.id } });
    await prisma.companyDiscount.deleteMany({ where: { companyId: company.id } });
    await prisma.membership.deleteMany({ where: { companyId: company.id } });
    await prisma.shiftTemplate.deleteMany({ where: { companyId: company.id } });
    await prisma.department.deleteMany({ where: { companyId: company.id } });

    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: "Grand Café Nassau",
        autoOpenWeeks: 3,
        closedWeekdays: [],
        showCompanyRosterToEmployees: true,
        autoApproveShiftSwaps: false,
        autoApproveHours: false,
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        billingName: "Grand Café Nassau B.V.",
        kvkNumber: "87654321",
        vatNumber: "NL856473921B01",
        address: "Nassaustraat 12",
        postalCode: "3512 AA",
        mollieCustomerId: null,
        mollieSubscriptionId: null,
        billingInterval: null,
        currentPeriodEnd: null,
      },
    });
  } else {
    company = await prisma.company.create({
      data: {
        name: "Grand Café Nassau",
        slug: DEMO_SLUG,
        autoOpenWeeks: 3,
        closedWeekdays: [],
        showCompanyRosterToEmployees: true,
        autoApproveShiftSwaps: false,
        autoApproveHours: false,
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        billingName: "Grand Café Nassau B.V.",
        kvkNumber: "87654321",
        vatNumber: "NL856473921B01",
        address: "Nassaustraat 12",
        postalCode: "3512 AA",
      },
    });
  }

  // ---------- 2. Teams ----------
  const bediening = await prisma.department.create({
    data: { companyId: company.id, name: "Bediening", color: "#3F6E5B", order: 0 },
  });
  const keuken = await prisma.department.create({
    data: { companyId: company.id, name: "Keuken", color: "#C9821F", order: 1 },
  });
  const deptByName: Record<string, string> = { Bediening: bediening.id, Keuken: keuken.id };

  // ---------- 3. Mensen + lidmaatschappen ----------
  const membershipByEmail: Record<string, { id: string; dept: string | null }> = {};

  for (const person of DEMO_PEOPLE) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, passwordHash, emailVerified: new Date() },
      create: {
        email: person.email,
        name: person.name,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: person.role,
        departmentId: person.dept ? deptByName[person.dept] : null,
      },
    });

    membershipByEmail[person.email] = { id: membership.id, dept: person.dept };
  }

  const owner = membershipByEmail["eigenaar@demo.shiftje.nl"];
  const manager = membershipByEmail["manager@demo.shiftje.nl"];
  const julia = membershipByEmail["julia@demo.shiftje.nl"];
  const tom = membershipByEmail["tom@demo.shiftje.nl"];
  const nina = membershipByEmail["nina@demo.shiftje.nl"];
  const ahmed = membershipByEmail["ahmed@demo.shiftje.nl"];
  const lotte = membershipByEmail["lotte@demo.shiftje.nl"];

  const bedieningTeam = [manager, julia, tom, nina];
  const keukenTeam = [ahmed, lotte];

  // ---------- 4. Standaard shifts ----------
  const middagshift = await prisma.shiftTemplate.create({
    data: {
      companyId: company.id,
      name: "Middagshift",
      startTime: "12:00",
      endTime: "18:00",
      weekdays: [1, 2, 3, 4, 5],
    },
  });
  const avondshift = await prisma.shiftTemplate.create({
    data: {
      companyId: company.id,
      name: "Avondshift",
      startTime: "17:00",
      endTime: "23:00",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
  });
  void middagshift;
  void avondshift;

  // ---------- 5. Rooster + beschikbaarheid, 5 weken (1 terug, 3 vooruit) ----------
  const thisWeekStart = mondayOf(new Date());
  const allMembers = [owner, manager, julia, tom, nina, ahmed, lotte];
  const shiftsToCreate: {
    companyId: string;
    membershipId: string | null;
    date: Date;
    startTime: string;
    endTime: string;
    role: string | null;
  }[] = [];
  const availabilityToCreate: {
    membershipId: string;
    date: Date;
    daypart: string;
    status: "AVAILABLE" | "UNSURE" | "UNAVAILABLE";
  }[] = [];

  for (let weekOffset = -1; weekOffset <= 3; weekOffset++) {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + dayOffset);
      const weekday = day.getDay(); // 0 = zo ... 6 = za

      // Bediening: middagshift doordeweeks, avondshift elke dag, rotatie
      // over de 3 medewerkers (manager af en toe als 4e).
      if ([1, 2, 3, 4, 5].includes(weekday)) {
        shiftsToCreate.push({
          companyId: company.id,
          membershipId: bedieningTeam[(dayOffset + weekOffset) % 3 === 0 ? 1 : (dayOffset % 3)].id,
          date: day,
          startTime: "12:00",
          endTime: "18:00",
          role: null,
        });
      }
      shiftsToCreate.push({
        companyId: company.id,
        membershipId: bedieningTeam[(dayOffset + 1) % bedieningTeam.length].id,
        date: day,
        startTime: "17:00",
        endTime: "23:00",
        role: null,
      });

      // Keuken: iets rustiger, avondshift elke dag, middagshift alleen
      // doordeweeks, rotatie over de 2 kok(kin)s.
      shiftsToCreate.push({
        companyId: company.id,
        membershipId: keukenTeam[dayOffset % 2].id,
        date: day,
        startTime: "17:00",
        endTime: "23:00",
        role: "Kok",
      });
      if ([1, 2, 3, 4, 5].includes(weekday)) {
        shiftsToCreate.push({
          companyId: company.id,
          membershipId: keukenTeam[(dayOffset + 1) % 2].id,
          date: day,
          startTime: "12:00",
          endTime: "18:00",
          role: "Kok",
        });
      }

      // Beschikbaarheid: iedere medewerker geeft voor elke dag iets door,
      // met een paar keer "weet niet" en "kan niet" voor de variatie.
      for (const member of [julia, tom, nina, ahmed, lotte]) {
        const seed = (dayOffset + weekOffset + member.id.length) % 5;
        const status = seed === 0 ? "UNAVAILABLE" : seed === 1 ? "UNSURE" : "AVAILABLE";
        availabilityToCreate.push({
          membershipId: member.id,
          date: day,
          daypart: "",
          status,
        });
      }
    }
  }

  await prisma.shift.createMany({ data: shiftsToCreate });
  await prisma.availability.createMany({ data: availabilityToCreate });

  // Eén onbeheerd/open shift, om te laten zien hoe dat eruitziet.
  const openShiftDay = new Date(thisWeekStart);
  openShiftDay.setDate(openShiftDay.getDate() + 5); // aanstaande zaterdag
  await prisma.shift.create({
    data: {
      companyId: company.id,
      membershipId: null,
      date: openShiftDay,
      startTime: "17:00",
      endTime: "23:00",
      role: "Bediening, extra druk verwacht",
    },
  });

  // ---------- 6. Een openstaand ruilverzoek, voor de showcase ----------
  const tomsShift = await prisma.shift.findFirst({
    where: { companyId: company.id, membershipId: tom.id, date: { gte: thisWeekStart } },
    orderBy: { date: "asc" },
  });
  if (tomsShift) {
    await prisma.shiftSwapRequest.create({
      data: {
        companyId: company.id,
        shiftId: tomsShift.id,
        offeredById: tom.id,
        status: "OPEN",
        notifiedMembershipIds: [julia.id, nina.id],
      },
    });
  }

  // ---------- 7. Een paar urenregels, verschillende statussen ----------
  const lastWeekApprovedDay = new Date(thisWeekStart);
  lastWeekApprovedDay.setDate(lastWeekApprovedDay.getDate() - 6);
  await prisma.timeEntry.createMany({
    data: [
      {
        companyId: company.id,
        membershipId: julia.id,
        date: lastWeekApprovedDay,
        startTime: "12:00",
        endTime: "18:00",
        status: "APPROVED",
        reviewedById: manager.id,
        reviewedAt: new Date(),
      },
      {
        companyId: company.id,
        membershipId: ahmed.id,
        date: lastWeekApprovedDay,
        startTime: "17:00",
        endTime: "23:15",
        note: "15 min later dicht, drukke avond",
        status: "SUBMITTED",
      },
      {
        companyId: company.id,
        membershipId: nina.id,
        date: thisWeekStart,
        startTime: "17:00",
        endTime: "",
        status: "DRAFT",
      },
    ],
  });

  return NextResponse.json({
    ok: true,
    company: { id: company.id, slug: company.slug, name: company.name },
    credentials: DEMO_PEOPLE.map((p) => ({ email: p.email, role: p.role, password: DEMO_PASSWORD })),
  });
}
