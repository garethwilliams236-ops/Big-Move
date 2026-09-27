import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { MeProvider } from "@/components/Me";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: name } = await supabase.rpc("my_name");

  if (!name) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="card p-6 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold">Not on the household list yet</h1>
          <p className="text-sm text-muted">
            You're signed in as <b>{user.email}</b>, but this email hasn't been added to Big Move. Ask Gareth or Kristin to add
            it under Settings.
          </p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  return (
    <MeProvider name={name as string} email={user.email ?? ""}>
      <Nav name={name as string} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </MeProvider>
  );
}
