import { useState } from "react";
import { Alert, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  Field,
  Screen,
  StatusBadge,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { ensureProfile } from "@/src/lib/api";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import type { UserType } from "@/src/types/models";

export default function SignUpScreen() {
  const params = useLocalSearchParams<{ path?: string }>();
  const path: UserType = params.path === "company" ? "company" : "talent";
  const { signUp, setPathPreference, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setPathPreference(path);
    try {
      const result = await signUp(email, password, path);
      if (result === "session") {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await ensureProfile(data.user.id, email.trim(), path);
          await refreshProfile();
        }
        router.replace("/");
        return;
      }
      Alert.alert(
        "Check your email",
        "Confirm your address, then come back to sign in.",
      );
      router.replace("/(auth)/sign-in");
    } catch (e) {
      Alert.alert(
        "Sign up failed",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Sign up" showBack />
      <View style={{ padding: 24 }}>
        <StatusBadge
          label={path === "company" ? "Company path" : "Talent path"}
          tone="info"
        />
        <View style={{ height: 12 }} />
        <Title>Create your account</Title>
        <Subtitle>
          Same account system as the web app — your profile follows you.
        </Subtitle>
        <View style={{ height: 20 }} />
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
        <Field
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
        />
        <Button label="Create account" onPress={onSubmit} loading={loading} />
        <View style={{ height: 16 }} />
        <Body muted>
          Already have an account?{" "}
          <Link href="/(auth)/sign-in" style={{ color: colors.text }}>
            Sign in
          </Link>
        </Body>
      </View>
    </Screen>
  );
}
