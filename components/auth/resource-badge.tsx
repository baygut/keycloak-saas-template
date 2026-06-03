import { Badge } from "@/components/ui/badge";
import type { ProtectedResourceId } from "@/lib/auth/resources";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { cn } from "@/lib/utils";

type ResourceBadgeProps = {
  resource: ProtectedResourceId;
  className?: string;
};

const VARIANT: Record<
  ProtectedResourceId,
  "secondary" | "destructive" | "outline"
> = {
  [PROTECTED_RESOURCES.USER]: "secondary",
  [PROTECTED_RESOURCES.ADMIN]: "destructive",
};

export function ResourceBadge({ resource, className }: ResourceBadgeProps) {
  return (
    <Badge variant={VARIANT[resource]} className={cn("font-mono text-xs", className)}>
      {resource}
    </Badge>
  );
}
