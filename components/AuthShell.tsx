"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import type { UserType } from "@/lib/supabase/types";

export function AuthShell() {
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path");
  const path: UserType | null =
    pathParam === "talent" || pathParam === "company" ? pathParam : null;
  const modeParam = searchParams.get("mode");
  const initialMode = modeParam === "signup" ? "signup" : "signin";

  return <AuthForm path={path} initialMode={initialMode} />;
}
