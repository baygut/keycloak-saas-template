import { prisma } from "@/lib/prisma";

export type AnalyticsEventInput = {
  event: string;
  path?: string;
  resourceId?: string;
  resourceType?: string;
  viewerKey?: string;
  durationMs?: number;
  meta?: string;
};

export async function persistAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event: input.event,
        path: input.path ?? null,
        resourceId: input.resourceId ?? null,
        resourceType: input.resourceType ?? null,
        viewerKey: input.viewerKey ?? null,
        durationMs: input.durationMs ?? null,
        meta: input.meta ?? null,
      },
    });
  } catch {
    // analytics must never break the app
  }
}

export async function getBlogViewCounts(
  blogIds: string[],
): Promise<Map<string, number>> {
  if (!blogIds.length) return new Map();

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["resourceId"],
    where: {
      event: "page_view",
      resourceType: "blog",
      resourceId: { in: blogIds },
    },
    _count: { id: true },
  });

  return new Map(rows.map((r) => [r.resourceId!, r._count.id]));
}

export type TopBlog = { slug: string; title: string; viewCount: number };
export type DailyView = { date: string; count: number };
export type RouteStatRow = { path: string; count: number; avgMs: number };

export type AdminAnalytics = {
  totalViews: number;
  totalBlogs: number;
  topBlogs: TopBlog[];
  dailyViews: DailyView[];
  routeStats: RouteStatRow[];
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [totalViews, totalBlogs, topBlogsRaw, dailyViewsRaw, routeStatsRaw] =
    await Promise.all([
      prisma.analyticsEvent.count({ where: { event: "page_view" } }),

      prisma.blog.count(),

      prisma.analyticsEvent.groupBy({
        by: ["resourceId"],
        where: { event: "page_view", resourceType: "blog" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT strftime('%Y-%m-%d', "createdAt") AS date, COUNT(*) AS count
        FROM "AnalyticsEvent"
        WHERE event = 'page_view'
          AND "createdAt" >= datetime('now', '-7 days')
        GROUP BY strftime('%Y-%m-%d', "createdAt")
        ORDER BY date ASC
      `,

      prisma.$queryRaw<{ path: string; count: bigint; avgMs: number }[]>`
        SELECT path, COUNT(*) AS count, AVG("durationMs") AS avgMs
        FROM "AnalyticsEvent"
        WHERE event = 'route_transition' AND path IS NOT NULL
        GROUP BY path
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

  const blogIds = topBlogsRaw
    .map((r) => r.resourceId)
    .filter(Boolean) as string[];

  const blogs = blogIds.length
    ? await prisma.blog.findMany({
        where: { id: { in: blogIds } },
        select: { id: true, slug: true, title: true },
      })
    : [];

  const blogMap = new Map(blogs.map((b) => [b.id, b]));

  const topBlogs = topBlogsRaw
    .map((r) => {
      const blog = blogMap.get(r.resourceId!);
      return blog
        ? { slug: blog.slug, title: blog.title, viewCount: r._count.id }
        : null;
    })
    .filter(Boolean) as TopBlog[];

  return {
    totalViews,
    totalBlogs,
    topBlogs,
    dailyViews: dailyViewsRaw.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
    routeStats: routeStatsRaw.map((r) => ({
      path: r.path,
      count: Number(r.count),
      avgMs: Math.round(r.avgMs ?? 0),
    })),
  };
}

export type UserAnalytics = {
  totalViews: number;
  blogs: { slug: string; title: string; viewCount: number }[];
};

export async function getUserAnalytics(
  ownerKey: string,
): Promise<UserAnalytics> {
  const blogs = await prisma.blog.findMany({
    where: { ownerKey },
    select: { id: true, slug: true, title: true },
  });

  if (!blogs.length) return { totalViews: 0, blogs: [] };

  const viewCounts = await getBlogViewCounts(blogs.map((b) => b.id));

  const blogsWithCounts = blogs.map((b) => ({
    slug: b.slug,
    title: b.title,
    viewCount: viewCounts.get(b.id) ?? 0,
  }));

  return {
    totalViews: blogsWithCounts.reduce((s, b) => s + b.viewCount, 0),
    blogs: blogsWithCounts,
  };
}

export type OtelSpanRow = {
  id: string;
  name: string;
  kind: string;
  durationMs: number;
  statusCode: string;
  service: string | null;
  startTime: Date;
};

export async function getRecentOtelSpans(limit = 20): Promise<OtelSpanRow[]> {
  return prisma.otelSpan.findMany({
    orderBy: { startTime: "desc" },
    take: Math.min(limit, 100),
    select: {
      id: true,
      name: true,
      kind: true,
      durationMs: true,
      statusCode: true,
      service: true,
      startTime: true,
    },
  });
}

export type AnalyticsEventRow = {
  id: string;
  event: string;
  path: string | null;
  resourceType: string | null;
  viewerKey: string | null;
  durationMs: number | null;
  createdAt: string;
};

export async function listAnalyticsEventsCursor(options: {
  cursor?: string;
  limit?: number;
}): Promise<{ events: AnalyticsEventRow[]; nextCursor: string | null }> {
  const take = Math.min(options.limit ?? 20, 100);

  const select = {
    id: true,
    event: true,
    path: true,
    resourceType: true,
    viewerKey: true,
    durationMs: true,
    createdAt: true,
  } as const;

  let rows: Awaited<ReturnType<typeof prisma.analyticsEvent.findMany<{ select: typeof select }>>>;
  if (options.cursor) {
    rows = await prisma.analyticsEvent.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      cursor: { id: options.cursor },
      skip: 1,
      select,
    });
  } else {
    rows = await prisma.analyticsEvent.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      select,
    });
  }

  const hasNext = rows.length > take;
  const items = hasNext ? rows.slice(0, take) : rows;

  return {
    events: items.map((r) => ({
      id: r.id,
      event: r.event,
      path: r.path,
      resourceType: r.resourceType,
      viewerKey: r.viewerKey,
      durationMs: r.durationMs,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasNext ? items[items.length - 1].id : null,
  };
}
