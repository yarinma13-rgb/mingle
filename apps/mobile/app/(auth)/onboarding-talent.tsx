import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Button, Field, Screen, Subtitle, Title } from "@/src/components/ui";
import { completeOnboarding } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

export default function OnboardingTalent() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish() {
    if (!user) return;
    setLoading(true);
    try {
      await completeOnboarding(user.id);
      await refreshProfile();
      router.replace("/(talent)/dashboard");
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
      <AppHeader title="Talent onboarding" />
      <View style={{ padding: 24, gap: 8 }}>
        <Title>What are you aiming for?</Title>
        <Subtitle>
          A short intent helps matching. You can refine everything later in
          your profile.
        </Subtitle>
        <Field
          label="Career goal"
          value={goal}
          onChangeText={setGoal}
          placeholder="e.g. Lead product design at a Series B"
        />
        <Button
          label="Continue to mingle"
          onPress={finish}
          loading={loading}
          disabled={!goal.trim()}
        />
      </View>
    </Screen>
  );
}
