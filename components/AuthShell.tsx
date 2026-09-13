"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import type { UserType } from "@/lib/supabase/types";

export function AuthShell() {
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path");
  const modeParam = searchParams.get("mode");
  const initialMode = modeParam === "signup" ? "signup" : "signin";
  // Signup ads/landing often hit /auth?mode=signup with no path. Talent is the
  // visual default — keep form state in sync so Continue is not stuck disabled.
  const path: UserType | null =
    pathParam === "talent" || pathParam === "company"
      ? pathParam
      : initialMode === "signup"
        ? "talent"
        : null;

  return <AuthForm path={path} initialMode={initialMode} />;
}
