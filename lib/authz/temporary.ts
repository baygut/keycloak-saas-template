import { prisma } from "@/lib/prisma";

export async function setTemporaryAccess(
  blogId: string,
  principal: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.temporaryAccess.upsert({
    where: { blogId_principal: { blogId, principal } },
    create: { blogId, principal, expiresAt },
    update: { expiresAt },
  });
}

export async function clearTemporaryAccess(
  blogId: string,
  principal: string,
): Promise<void> {
  await prisma.temporaryAccess.deleteMany({ where: { blogId, principal } });
}

export async function getTemporaryExpiry(
  blogId: string,
  principal: string,
): Promise<Date | null> {
  const record = await prisma.temporaryAccess.findUnique({
    where: { blogId_principal: { blogId, principal } },
  });
  return record?.expiresAt ?? null;
}

export async function getExpiryMapForBlog(
  blogId: string,
): Promise<Map<string, Date>> {
  const records = await prisma.temporaryAccess.findMany({ where: { blogId } });
  return new Map(records.map((r) => [r.principal, r.expiresAt]));
}
