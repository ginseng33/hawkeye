import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "./actions";

async function LoginError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-[20px] border border-border bg-card p-8 shadow-soft">
        <p className="font-technical mb-6 text-center text-[16px] text-foreground">HAWKEYE</p>
        <form action={signIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-technical text-[11px] text-muted-foreground">
              Email
            </label>
            <Input id="email" name="email" type="email" required className="bezel border-border" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-technical text-[11px] text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bezel border-border"
            />
          </div>
          <Suspense fallback={null}>
            <LoginError searchParams={searchParams} />
          </Suspense>
          <Button type="submit" className="mt-2">
            Accedi
          </Button>
        </form>
      </div>
    </div>
  );
}
