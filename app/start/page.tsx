import { HomeShell } from "@/components/HomeShell";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";

export default async function StartPage() {
  await redirectIfAuthenticated();
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <HomeShell />
    </main>
  );
}
