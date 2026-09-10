"use client";

import { useEffect } from "react";
import { syncWebPushIfGranted } from "@/lib/push/client";

export function PushRegistrar() {
  useEffect(() => {
    void syncWebPushIfGranted();
  }, []);
  return null;
}
