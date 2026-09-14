import { prisma } from "@/lib/prisma";

export async function notify(
  companyId: string,
  membershipIds: string[],
  data: { title: string; body?: string; link?: string }
) {
  if (membershipIds.length === 0) return;
  await prisma.notification.createMany({
    data: membershipIds.map((membershipId) => ({
      companyId,
      membershipId,
      title: data.title,
      body: data.body,
      link: data.link,
    })),
  });
}
