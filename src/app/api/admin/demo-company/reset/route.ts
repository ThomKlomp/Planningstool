import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const DEMO_SLUG = "demo";
const DEMO_PASSWORD = "Demo1234!";

const DEMO_DEPARTMENTS = [
  { name: "Bediening", color: "#3F6E5B" },
  { name: "Keuken", color: "#C9821F" },
  { name: "Bar", color: "#7A5C9E" },
];

const DEMO_PEOPLE = [
  { email: "eigenaar@demo.shiftje.nl", name: "Sanne de Vries", role: "OWNER" as const, dept: null as string | null },
  { email: "manager.bediening@demo.shiftje.nl", name: "Mark Jansen", role: "MANAGER" as const, dept: "Bediening" },
  { email: "manager.keuken@demo.shiftje.nl", name: "Elif Yildiz", role: "MANAGER" as const, dept: "Keuken" },

  // Bediening
  { email: "julia@demo.shiftje.nl", name: "Julia Bakker", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "tom@demo.shiftje.nl", name: "Tom Visser", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "nina@demo.shiftje.nl", name: "Nina de Boer", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "daan@demo.shiftje.nl", name: "Daan Mulder", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "eva@demo.shiftje.nl", name: "Eva Peters", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "sem@demo.shiftje.nl", name: "Sem Willems", role: "EMPLOYEE" as const, dept: "Bediening" },
  { email: "fleur@demo.shiftje.nl", name: "Fleur Dekker", role: "EMPLOYEE" as const, dept: "Bediening" },

  // Keuken
  { email: "ahmed@demo.shiftje.nl", name: "Ahmed El Idrissi", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "lotte@demo.shiftje.nl", name: "Lotte Smit", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "bram@demo.shiftje.nl", name: "Bram Hendriks", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "sara@demo.shiftje.nl", name: "Sara van Dijk", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "youssef@demo.shiftje.nl", name: "Youssef Amrani", role: "EMPLOYEE" as const, dept: "Keuken" },
  { email: "iris@demo.shiftje.nl", name: "Iris Bos", role: "EMPLOYEE" as const, dept: "Keuken" },

  // Bar
  { email: "milan@demo.shiftje.nl", name: "Milan de Groot", role: "EMPLOYEE" as const, dept: "Bar" },
  { email: "roos@demo.shiftje.nl", name: "Roos van der Berg", role: "EMPLOYEE" as const, dept: "Bar" },
  { email: "finn@demo.shiftje.nl", name: "Finn Kuipers", role: "EMPLOYEE" as const, dept: "Bar" },
];

const DEPT_ROLE_LABEL: Record<string, string | null> = {
  Bediening: null,
  Keuken: "Kok",
  Bar: "Bar",
};

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function emailSeed(email: string) {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 997;
  return h;
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

  const baseCompanyData = {
    name: "Grand Café Nassau",
    autoOpenWeeks: 3,
    closedWeekdays: [] as number[],
    showCompanyRosterToEmployees: true,
    autoApproveShiftSwaps: false,
    autoApproveHours: false,
    subscriptionStatus: "TRIALING" as const,
    trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    billingName: "Grand Café Nassau B.V.",
    kvkNumber: "87654321",
    vatNumber: "NL856473921B01",
    address: "Nassaustraat 12",
    postalCode: "3512 AA",
  };

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
    await prisma.rosterWeek.deleteMany({ where: { companyId: company.id } });
    await prisma.rosterEvent.deleteMany({ where: { companyId: company.id } });
    await prisma.closedDay.deleteMany({ where: { companyId: company.id } });
    await prisma.invite.deleteMany({ where: { companyId: company.id } });
    await prisma.companyDiscount.deleteMany({ where: { companyId: company.id } });
    await prisma.membership.deleteMany({ where: { companyId: company.id } });
    await prisma.shiftTemplate.deleteMany({ where: { companyId: company.id } });
    await prisma.department.deleteMany({ where: { companyId: company.id } });

    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...baseCompanyData,
        mollieCustomerId: null,
        mollieSubscriptionId: null,
        billingInterval: null,
        currentPeriodEnd: null,
      },
    });
  } else {
    company = await prisma.company.create({
      data: { ...baseCompanyData, slug: DEMO_SLUG },
    });
  }

  // ---------- 2. Teams ----------
  const deptByName: Record<string, string> = {};
  for (let i = 0; i < DEMO_DEPARTMENTS.length; i++) {
    const d = DEMO_DEPARTMENTS[i];
    const dept = await prisma.department.create({
      data: { companyId: company.id, name: d.name, color: d.color, order: i },
    });
    deptByName[d.name] = dept.id;
  }

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

  // Medewerkers gegroepeerd per team, voor de roosterrotatie hieronder.
  const employeesByDept: Record<string, { id: string }[]> = {};
  for (const person of DEMO_PEOPLE) {
    if (person.role !== "EMPLOYEE" || !person.dept) continue;
    if (!employeesByDept[person.dept]) employeesByDept[person.dept] = [];
    employeesByDept[person.dept].push(membershipByEmail[person.email]);
  }

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

  // ---------- 5. Rooster + beschikbaarheid, 5 weken (1 terug, 3 vooruit) ----------
  const thisWeekStart = mondayOf(new Date());
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
      const isWeekday = weekday >= 1 && weekday <= 5;

      for (const deptName of Object.keys(employeesByDept)) {
        const team = employeesByDept[deptName];
        if (team.length === 0) continue;
        const roleLabel = DEPT_ROLE_LABEL[deptName] ?? null;

        // Avondshift: elke dag, rotatie over het hele team.
        shiftsToCreate.push({
          companyId: company.id,
          membershipId: team[(dayOffset + weekOffset + 7) % team.length].id,
          date: day,
          startTime: "17:00",
          endTime: "23:00",
          role: roleLabel,
        });

        // Middagshift: alleen doordeweeks, iemand anders dan de avondshift.
        if (isWeekday && team.length > 1) {
          shiftsToCreate.push({
            companyId: company.id,
            membershipId: team[(dayOffset + weekOffset + 8) % team.length].id,
            date: day,
            startTime: "12:00",
            endTime: "18:00",
            role: roleLabel,
          });
        }
      }

      // Beschikbaarheid: per medewerker, per van toepassing zijnde
      // standaard-shift die dag (zoals het rooster het ook verwacht: de
      // "daypart" moet het id van het shift-sjabloon zijn, anders matcht
      // er niks en lijkt het scherm leeg).
      const templatesToday = [avondshift, ...(isWeekday ? [middagshift] : [])];

      for (const person of DEMO_PEOPLE) {
        if (person.role !== "EMPLOYEE") continue;
        const member = membershipByEmail[person.email];

        for (const template of templatesToday) {
          const seed =
            (dayOffset * 3 + weekOffset * 5 + emailSeed(person.email) + template.name.length) % 5;
          const status = seed === 0 ? "UNAVAILABLE" : seed === 1 ? "UNSURE" : "AVAILABLE";
          availabilityToCreate.push({
            membershipId: member.id,
            date: day,
            daypart: template.id,
            status,
          });
        }
      }
    }
  }

  await prisma.shift.createMany({ data: shiftsToCreate });
  await prisma.availability.createMany({ data: availabilityToCreate });

  // Alle demo-weken publiceren, anders zien de demo-medewerkers geen rooster.
  await prisma.rosterWeek.createMany({
    data: [-1, 0, 1, 2, 3].map((weekOffset) => {
      const weekStart = new Date(thisWeekStart);
      weekStart.setDate(weekStart.getDate() + weekOffset * 7);
      return {
        companyId: company.id,
        weekStart,
        published: true,
        publishedAt: new Date(),
        notifiedAt: new Date(),
      };
    }),
  });

  // Een voorbeeld-evenement, om te laten zien hoe dat op het rooster staat.
  const eventDay = new Date(thisWeekStart);
  eventDay.setDate(eventDay.getDate() + 5); // aanstaande zaterdag
  await prisma.rosterEvent.create({
    data: {
      companyId: company.id,
      date: eventDay,
      title: "Feestje van Bas",
      description: "Besloten feest met ongeveer 60 gasten, verwacht een drukke avond.",
      startTime: "19:00",
      endTime: "01:00",
    },
  });

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
  const tom = membershipByEmail["tom@demo.shiftje.nl"];
  const julia = membershipByEmail["julia@demo.shiftje.nl"];
  const nina = membershipByEmail["nina@demo.shiftje.nl"];
  const ahmed = membershipByEmail["ahmed@demo.shiftje.nl"];
  const manager = membershipByEmail["manager.bediening@demo.shiftje.nl"];

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
  const lastWeekDay = new Date(thisWeekStart);
  lastWeekDay.setDate(lastWeekDay.getDate() - 6);
  await prisma.timeEntry.createMany({
    data: [
      {
        companyId: company.id,
        membershipId: julia.id,
        date: lastWeekDay,
        startTime: "12:00",
        endTime: "18:00",
        status: "APPROVED",
        reviewedById: manager.id,
        reviewedAt: new Date(),
      },
      {
        companyId: company.id,
        membershipId: ahmed.id,
        date: lastWeekDay,
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
