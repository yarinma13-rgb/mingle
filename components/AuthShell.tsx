"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import type { UserType } from "@/lib/supabase/types";

export function AuthShell() {
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path");
  const modeParam = searchParams.get("mode");
  const errorParam = searchParams.get("error");
  const initialMode = modeParam === "signup" ? "signup" : "signin";
  // Never pre-select a segment — people were confirming Company by accident and
  // landing personal inboxes on the company track. Explicit path query only.
  const path: UserType | null =
    pathParam === "talent" || pathParam === "company" ? pathParam : null;

  return (
    <AuthForm
      path={path}
      initialMode={initialMode}
      initialError={errorParam === "work_email" ? "work_email" : null}
    />
  );
}
