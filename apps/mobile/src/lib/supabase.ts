import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const supabaseUrl =
  (extra.supabaseUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";

export const supabaseAnonKey =
  (extra.supabaseAnonKey as string | undefined) ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

function looksLikePlaceholder(value: string) {
  const v = value.trim();
  if (!v) return true;
  return (
    v.includes("YOUR_PROJECT") ||
    v.includes("YOUR_ANON_KEY") ||
    v.includes("placeholder") ||
    v === "https://placeholder.supabase.co"
  );
}

/** True only when real Supabase URL + anon key are present (not .env.example placeholders). */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !looksLikePlaceholder(supabaseUrl) &&
    !looksLikePlaceholder(supabaseAnonKey),
);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
