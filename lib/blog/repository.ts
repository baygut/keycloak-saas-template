import type { BlogVisibility } from "@/lib/auth/constants";
import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import { getSessionPrincipal, isAdmin } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";
import { appendSlugSuffix, slugifyTitle } from "@/lib/blog/slug";
import {
  deleteBlogTuples,
  listSharedBlogIds,
  writeBlogOwnerTuple,
} from "@/lib/authz/blog";
import { isOpenFgaConfigured } from "@/lib/openfga";
import { prisma } from "@/lib/prisma";

export type BlogInput = {
  title: string;
  summary: string;
  content: string;
  visibility?: BlogVisibility;
  slug?: string;
};

function mapBlog(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  visibility: string;
  ownerKey: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
}): BlogRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    visibility: row.visibility,
    ownerKey: row.ownerKey,
    ownerName: row.ownerName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await prisma.blog.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = appendSlugSuffix(base);
    attempt += 1;
  }

  return appendSlugSuffix(base);
}

export async function listBlogsForViewer(
  session: SessionUser,
): Promise<BlogRecord[]> {
  if (isAdmin(session)) {
    const rows = await prisma.blog.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapBlog);
  }

  const principal = getSessionPrincipal(session);
  const sharedIds = isOpenFgaConfigured()
    ? await listSharedBlogIds(principal)
    : [];

  const rows = await prisma.blog.findMany({
    where: {
      OR: [{ ownerKey: principal }, { id: { in: sharedIds } }],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return rows.map(mapBlog);
}

export async function getBlogBySlug(slug: string): Promise<BlogRecord | null> {
  const row = await prisma.blog.findUnique({ where: { slug } });
  return row ? mapBlog(row) : null;
}

export async function createBlog(
  session: SessionUser,
  input: BlogInput,
): Promise<BlogRecord> {
  const ownerKey = getSessionPrincipal(session);
  const baseSlug = slugifyTitle(input.slug?.trim() || input.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const visibility = input.visibility ?? BLOG_VISIBILITY.PRIVATE;

  const row = await prisma.blog.create({
    data: {
      slug,
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.content.trim(),
      visibility,
      ownerKey,
      ownerName: session.name,
    },
  });

  await writeBlogOwnerTuple(ownerKey, row.id);

  return mapBlog(row);
}

export async function updateBlog(
  session: SessionUser,
  slug: string,
  input: Partial<BlogInput>,
): Promise<BlogRecord | null> {
  const existing = await getBlogBySlug(slug);

  if (!existing) {
    return null;
  }

  const row = await prisma.blog.update({
    where: { slug },
    data: {
      title: input.title?.trim() ?? existing.title,
      summary: input.summary?.trim() ?? existing.summary,
      content: input.content?.trim() ?? existing.content,
      visibility: input.visibility ?? existing.visibility,
    },
  });

  return mapBlog(row);
}

export async function deleteBlogBySlug(slug: string): Promise<boolean> {
  try {
    const existing = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await deleteBlogTuples(existing.id);
    await prisma.blog.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
