import type { AppUser, UserType } from "@/src/types/models";
import { isOnboarded } from "@/src/providers/AuthProvider";

export type AppGate =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "welcome" }
  | { kind: "onboarding"; userType: UserType }
  | { kind: "app"; userType: UserType };

export function resolveGate(input: {
  ready: boolean;
  configured: boolean;
  session: boolean;
  profile: AppUser | null;
  pathPreference: UserType | null;
}): AppGate {
  if (!input.ready) return { kind: "loading" };
  if (!input.configured) return { kind: "unconfigured" };
  if (!input.session) return { kind: "welcome" };
  const type =
    input.profile?.user_type ?? input.pathPreference ?? ("talent" as UserType);
  if (!isOnboarded(input.profile)) return { kind: "onboarding", userType: type };
  return { kind: "app", userType: type };
}
