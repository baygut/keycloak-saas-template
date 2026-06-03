import { getOpenFgaClient, isOpenFgaConfigured } from "@/lib/openfga";
import logger from "@/lib/logger";
import { ClientWriteRequestOnMissingDeletes } from "@openfga/sdk";

const log = logger.child("authz");

export type AuthzTuple = {
  user: string;
  relation: string;
  object: string;
};

export async function can(
  user: string,
  relation: string,
  object: string,
): Promise<boolean> {
  if (!isOpenFgaConfigured()) {
    log.warn("OpenFGA not configured; denying check", {
      user,
      relation,
      object,
    });
    return false;
  }

  try {
    const { allowed } = await getOpenFgaClient().check({
      user,
      relation,
      object,
    });
    return allowed === true;
  } catch (error) {
    log.error("OpenFGA check failed", {
      user,
      relation,
      object,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function writeTuples(writes: AuthzTuple[]): Promise<void> {
  if (!writes.length || !isOpenFgaConfigured()) {
    return;
  }

  await getOpenFgaClient().write({ writes });
}

export async function deleteTuples(deletes: AuthzTuple[]): Promise<void> {
  if (!deletes.length || !isOpenFgaConfigured()) {
    return;
  }

  await getOpenFgaClient().write(
    { deletes },
    {
      conflict: {
        onMissingDeletes: ClientWriteRequestOnMissingDeletes.Ignore,
      },
    },
  );
}

export async function listObjectIds(
  user: string,
  relation: string,
  type: string,
): Promise<string[]> {
  if (!isOpenFgaConfigured()) {
    return [];
  }

  try {
    const { objects } = await getOpenFgaClient().listObjects({
      user,
      relation,
      type,
    });
    return (objects ?? []).map((object) => object.replace(`${type}:`, ""));
  } catch (error) {
    log.error("OpenFGA listObjects failed", {
      user,
      relation,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
