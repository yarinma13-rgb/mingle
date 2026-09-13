import { useState } from "react";
import { Alert, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  Field,
  Screen,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (e) {
      Alert.alert(
        "Sign in failed",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Sign in" showBack />
      <View style={{ padding: 24 }}>
        <Title>Welcome back</Title>
        <Subtitle>Sign in to continue your relationships on mingle.</Subtitle>
        <View style={{ height: 20 }} />
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
        />
        <Field
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
        <Button label="Sign in" onPress={onSubmit} loading={loading} />
        <View style={{ height: 16 }} />
        <Body muted>
          New here?{" "}
          <Link href="/(auth)/path" style={{ color: colors.text }}>
            Create an account
          </Link>
        </Body>
      </View>
    </Screen>
  );
}
