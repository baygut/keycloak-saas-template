"use server";

import logger from "@/lib/logger";

const log = logger.child("error-boundary");

export async function logClientError(
  message: string,
  componentStack: string | undefined,
): Promise<void> {
  await log.error(message, { componentStack });
}
