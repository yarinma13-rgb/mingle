"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/components/AuthForm";
import type { UserType } from "@/lib/supabase/types";

export function AuthShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path");
  const path: UserType | null =
    pathParam === "talent" || pathParam === "company" ? pathParam : null;

  useEffect(() => {
    if (!path) router.replace("/");
  }, [path, router]);

  if (!path) return null;

  return <AuthForm path={path} />;
}
