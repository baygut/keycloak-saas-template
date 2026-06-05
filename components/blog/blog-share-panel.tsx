"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  grantBlogAccessAction,
  listBlogSharesAction,
  revokeBlogAccessAction,
  type BlogCollaboratorDto,
} from "@/actions/blog/share-blog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlogShareRelation } from "@/lib/authz/principals";

const ACCESS_LEVELS: { value: BlogShareRelation; label: string; hint: string }[] =
  [
    {
      value: "viewer",
      label: "Viewer",
      hint: "Can read this private post",
    },
    {
      value: "editor",
      label: "Editor",
      hint: "Can view and edit content",
    },
    {
      value: "admin",
      label: "Admin",
      hint: "Can edit and manage who has access",
    },
  ];

type BlogSharePanelProps = {
  slug: string;
  ownerKey: string;
};

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date <= now) return "Expired";
  return `Expires ${date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
}

export function BlogSharePanel({ slug, ownerKey }: BlogSharePanelProps) {
  const [collaborators, setCollaborators] = useState<BlogCollaboratorDto[]>([]);
  const [principal, setPrincipal] = useState("");
  const [relation, setRelation] = useState<BlogShareRelation>("viewer");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const refreshShares = useCallback(async () => {
    const result = await listBlogSharesAction(slug);
    setLoading(false);

    if (result.ok) {
      setCollaborators(result.data.collaborators);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshShares();
  }, [refreshShares]);

  function handleGrant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await grantBlogAccessAction({
        slug,
        principal,
        relation,
        expiresAt: expiresAt || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPrincipal("");
      setExpiresAt("");
      await refreshShares();
    });
  }

  function handleRevoke(targetPrincipal: string) {
    setError(null);

    startTransition(async () => {
      const result = await revokeBlogAccessAction({
        slug,
        principal: targetPrincipal,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await refreshShares();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share access</CardTitle>
        <CardDescription>
          Grant view, edit, or admin access to another Keycloak user by their
          username (e.g. <code className="text-xs">demo.user</code>). Owner:{" "}
          <span className="font-medium text-foreground">{ownerKey}</span>.
          Permissions are enforced by OpenFGA on the server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleGrant} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="share-principal">Username</Label>
              <Input
                id="share-principal"
                value={principal}
                onChange={(event) => setPrincipal(event.target.value)}
                placeholder="demo.user"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-relation">Access</Label>
              <Select
                value={relation}
                onValueChange={(value) =>
                  setRelation(value as BlogShareRelation)
                }
              >
                <SelectTrigger id="share-relation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Saving..." : "Grant access"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-expires">Expires (optional)</Label>
            <Input
              id="share-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for permanent access.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {ACCESS_LEVELS.find((level) => level.value === relation)?.hint}
          </p>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium">People with access</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collaborators yet. Only the owner and admins can open this
              private post until you share it.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {collaborators.map((entry) => (
                <li
                  key={entry.principal}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium">{entry.principal}</span>
                    <span className="ml-2 text-xs uppercase tracking-wider text-muted-foreground">
                      {entry.relation}
                    </span>
                    {entry.expiresAt ? (
                      <span
                        className={`ml-2 text-xs ${new Date(entry.expiresAt) <= new Date() ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        · {formatExpiry(entry.expiresAt)}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRevoke(entry.principal)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
