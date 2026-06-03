import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTH_PATHS } from "@/lib/auth/constants";

export const dynamic = "force-static";

export default function SignedOutPage() {
  return (
    <div className="flex min-w-md flex-col items-center justify-center bg-background px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Signed out</CardTitle>
          <CardDescription>
            Your application session was cleared and you were signed out of
            Keycloak.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild>
            <a href={AUTH_PATHS.LOGIN}>Sign in again</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
