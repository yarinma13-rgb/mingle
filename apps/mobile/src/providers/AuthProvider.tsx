import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { AppUser, UserType } from "@/src/types/models";

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: AppUser | null;
  configured: boolean;
  refreshProfile: () => Promise<AppUser | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userType: UserType,
  ) => Promise<"confirm" | "session">;
  signOut: () => Promise<void>;
  setPathPreference: (path: UserType) => void;
  pathPreference: UserType | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, user_type, onboarding_status, onboarding_step, profile_completion",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as AppUser | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [pathPreference, setPathPreference] = useState<UserType | null>(null);

  const refreshProfile = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setProfile(null);
      return null;
    }
    const next = await loadProfile(uid);
    setProfile(next);
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (alive) setReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) {
        try {
          const p = await loadProfile(data.session.user.id);
          if (alive) setProfile(p);
        } catch {
          if (alive) setProfile(null);
        }
      }
      if (alive) setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, next) => {
      setSession(next);
      if (next?.user) {
        try {
          setProfile(await loadProfile(next.user.id));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, userType: UserType) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { user_type: userType } },
      });
      if (error) throw error;
      return data.session ? "session" : "confirm";
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      configured: isSupabaseConfigured,
      refreshProfile,
      signIn,
      signUp,
      signOut,
      setPathPreference,
      pathPreference,
    }),
    [ready, session, profile, refreshProfile, signIn, signUp, signOut, pathPreference],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function isOnboarded(profile: AppUser | null): boolean {
  if (!profile) return false;
  return (
    profile.onboarding_status === "completed" || profile.onboarding_step >= 4
  );
}
