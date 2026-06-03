export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "blog"
  );
}

export function appendSlugSuffix(base: string): string {
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
