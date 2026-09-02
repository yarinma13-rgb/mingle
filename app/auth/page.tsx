import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Suspense fallback={null}>
        <AuthShell />
      </Suspense>
    </main>
  );
}
