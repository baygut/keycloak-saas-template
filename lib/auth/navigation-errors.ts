import { unstable_rethrow } from "next/navigation";

/** Re-throw Next.js redirect/forbidden/notFound errors from server action catch blocks. */
export function rethrowNavigationErrors(error: unknown): void {
  unstable_rethrow(error);
}
