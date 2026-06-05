import {
  BLOG_SHARE_RELATIONS,
  type BlogShareRelation,
  isBlogShareRelation,
  parseFgaUser,
  toFgaBlog,
  toFgaUser,
} from "@/lib/authz/principals";
import { can, deleteTuples, listObjectIds, writeTuples } from "@/lib/authz/can";
import {
  clearTemporaryAccess,
  getExpiryMapForBlog,
  setTemporaryAccess,
} from "@/lib/authz/temporary";
import {
  ClientWriteRequestOnDuplicateWrites,
  ClientWriteRequestOnMissingDeletes,
} from "@openfga/sdk";
import { getOpenFgaClient, isOpenFgaConfigured } from "@/lib/openfga";
import logger from "@/lib/logger";

const log = logger.child("authz-blog");

export type BlogCollaborator = {
  principal: string;
  relation: BlogShareRelation;
  expiresAt?: Date;
};

export async function writeBlogOwnerTuple(
  ownerPrincipal: string,
  blogId: string,
): Promise<void> {
  await writeTuples([
    {
      user: toFgaUser(ownerPrincipal),
      relation: "owner",
      object: toFgaBlog(blogId),
    },
  ]);
}

export async function deleteBlogTuples(blogId: string): Promise<void> {
  if (!isOpenFgaConfigured()) {
    return;
  }

  const object = toFgaBlog(blogId);
  const tuples: { user: string; relation: string; object: string }[] = [];

  try {
    let continuationToken: string | undefined;

    do {
      const response = await getOpenFgaClient().read(
        { object },
        continuationToken ? { continuationToken } : {},
      );
      for (const tuple of response.tuples ?? []) {
        const key = tuple.key;
        if (key?.user && key.relation) {
          tuples.push({
            user: key.user,
            relation: key.relation,
            object: key.object ?? object,
          });
        }
      }
      continuationToken = response.continuation_token;
    } while (continuationToken);
  } catch (error) {
    log.error("OpenFGA read failed while deleting blog tuples", {
      blogId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (tuples.length) {
    await deleteTuples(tuples);
  }
}

export async function canViewBlogFga(
  principal: string,
  blogId: string,
): Promise<boolean> {
  return can(toFgaUser(principal), "can_view", toFgaBlog(blogId));
}

export async function canEditBlogFga(
  principal: string,
  blogId: string,
): Promise<boolean> {
  return can(toFgaUser(principal), "can_edit", toFgaBlog(blogId));
}

export async function canDeleteBlogFga(
  principal: string,
  blogId: string,
): Promise<boolean> {
  return can(toFgaUser(principal), "can_delete", toFgaBlog(blogId));
}

export async function canShareBlogFga(
  principal: string,
  blogId: string,
): Promise<boolean> {
  return can(toFgaUser(principal), "can_share", toFgaBlog(blogId));
}

export async function listSharedBlogIds(principal: string): Promise<string[]> {
  return listObjectIds(toFgaUser(principal), "can_view", "blog");
}

export async function listBlogCollaborators(
  blogId: string,
): Promise<BlogCollaborator[]> {
  if (!isOpenFgaConfigured()) {
    return [];
  }

  const object = toFgaBlog(blogId);
  const collaborators: BlogCollaborator[] = [];

  try {
    let continuationToken: string | undefined;

    do {
      const response = await getOpenFgaClient().read(
        { object },
        continuationToken ? { continuationToken } : {},
      );

      for (const tuple of response.tuples ?? []) {
        const relation = tuple.key?.relation;
        const user = tuple.key?.user;
        if (!relation || !user || !isBlogShareRelation(relation)) {
          continue;
        }
        const principal = parseFgaUser(user);
        if (principal) {
          collaborators.push({ principal, relation });
        }
      }

      continuationToken = response.continuation_token;
    } while (continuationToken);
  } catch (error) {
    log.error("OpenFGA read failed for collaborators", {
      blogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const expiryMap = await getExpiryMapForBlog(blogId);

  return collaborators
    .map((c) => ({
      ...c,
      expiresAt: expiryMap.get(c.principal),
    }))
    .sort((a, b) => a.principal.localeCompare(b.principal));
}

export async function grantBlogAccess(
  blogId: string,
  targetPrincipal: string,
  relation: BlogShareRelation,
  expiresAt?: Date,
): Promise<void> {
  const object = toFgaBlog(blogId);
  const user = toFgaUser(targetPrincipal);

  const deletes = BLOG_SHARE_RELATIONS.filter((r) => r !== relation)
    .map((shareRelation) => ({
      user,
      relation: shareRelation,
      object,
    }));

  await getOpenFgaClient().write(
    {
      deletes,
      writes: [{ user, relation, object }],
    },
    {
      conflict: {
        onMissingDeletes: ClientWriteRequestOnMissingDeletes.Ignore,
        onDuplicateWrites: ClientWriteRequestOnDuplicateWrites.Ignore,
      },
    },
  );

  if (expiresAt) {
    await setTemporaryAccess(blogId, targetPrincipal, expiresAt);
  } else {
    await clearTemporaryAccess(blogId, targetPrincipal);
  }
}

export async function revokeBlogAccess(
  blogId: string,
  targetPrincipal: string,
): Promise<void> {
  const object = toFgaBlog(blogId);
  const user = toFgaUser(targetPrincipal);

  const existing = await listBlogCollaborators(blogId);

  const deletes = existing
    .filter((c) => c.principal === targetPrincipal)
    .map((c) => ({
      user,
      relation: c.relation,
      object,
    }));

  if (deletes.length === 0) return;

  await Promise.all([
    deleteTuples(deletes),
    clearTemporaryAccess(blogId, targetPrincipal),
  ]);
}
