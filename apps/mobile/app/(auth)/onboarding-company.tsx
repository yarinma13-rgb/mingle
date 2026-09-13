import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Button, Field, Screen, Subtitle, Title } from "@/src/components/ui";
import { completeOnboarding } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

export default function OnboardingCompany() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish() {
    if (!user) return;
    setLoading(true);
    try {
      await completeOnboarding(user.id);
      await refreshProfile();
      router.replace("/(company)/dashboard");
    } catch (e) {
      Alert.alert(
        "Could not finish onboarding",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Company onboarding" />
      <View style={{ padding: 24, gap: 8 }}>
        <Title>Who are you hiring for?</Title>
        <Subtitle>
          Start with the company name — full culture DNA comes in the profile
          builder next.
        </Subtitle>
        <Field
          label="Company name"
          value={company}
          onChangeText={setCompany}
          placeholder="Acme Labs"
        />
        <Button
          label="Continue to mingle"
          onPress={finish}
          loading={loading}
          disabled={!company.trim()}
        />
      </View>
    </Screen>
  );
}
