import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Button,
  Card,
  ChipPicker,
  LoadingBlock,
  Screen,
  ScoreRing,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { loadFit, saveFit, type FitKind } from "@/src/lib/api";
import {
  COMPANY_VALUES,
  COMPANY_WORK_ENVIRONMENT,
  TALENT_DRIVES,
  TALENT_WORK_STYLE,
} from "@/src/lib/fitOptions";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

const COPY = {
  talent: {
    steps: [
      {
        title: "What drives you?",
        subtitle: "Pick up to 5 — they're the strongest signal in your match.",
        options: TALENT_DRIVES,
        max: 5,
      },
      {
        title: "How do you work best?",
        subtitle: "The environment that brings out your best.",
        options: TALENT_WORK_STYLE,
        max: 6,
      },
    ],
    primaryLabel: "What drives you",
    secondaryLabel: "How you work",
    home: "/(talent)/discover",
    homeLabel: "Go to Discover",
    edit: "/profile/build",
  },
  company: {
    steps: [
      {
        title: "What do you hire for?",
        subtitle: "Pick up to 5 values — same vocabulary talent uses.",
        options: COMPANY_VALUES,
        max: 5,
      },
      {
        title: "How does your team work?",
        subtitle: "The day-to-day style talent will feel.",
        options: COMPANY_WORK_ENVIRONMENT,
        max: 6,
      },
    ],
    primaryLabel: "What you hire for",
    secondaryLabel: "How your team works",
    home: "/(company)/candidates",
    homeLabel: "Go to Candidates",
    edit: "/company-profile/build",
  },
} as const;

/** Two chip steps then a "profile ready" summary. Shared by the talent and
 *  company fit screens; reachable from onboarding and the More tab. */
export function FitFlow({ kind }: { kind: FitKind }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const copy = COPY[kind];
  const [step, setStep] = useState(0);
  const [primary, setPrimary] = useState<string[]>([]);
  const [secondary, setSecondary] = useState<string[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadFit(user.id, kind)
      .then((fit) => {
        setPrimary(fit.primary);
        setSecondary(fit.secondary);
        setCompleteness(fit.completeness);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, kind]);

  async function onFinish() {
    if (!user) return;
    setSaving(true);
    try {
      await saveFit(user.id, kind, primary, secondary);
      const fit = await loadFit(user.id, kind);
      setCompleteness(fit.completeness);
      setStep(2);
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Your fit" showBack />
        <LoadingBlock />
      </Screen>
    );
  }

  if (step === 2) {
    return (
      <Screen>
        <AppHeader title="Profile ready" />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: "center" }}>
          <View style={{ marginTop: 12 }}>
            <ScoreRing score={completeness} size={132} color={brand.accentViolet} />
          </View>
          <Title>Profile ready</Title>
          <Subtitle>
            {completeness >= 100
              ? "Everything the match engine looks at is filled in."
              : "Fill in the rest of your profile for sharper matches."}
          </Subtitle>
          {[
            { label: copy.primaryLabel, items: primary },
            { label: copy.secondaryLabel, items: secondary },
          ].map((group) => (
            <Card key={group.label} style={{ alignSelf: "stretch", gap: 10 }}>
              <Text
                style={{ fontFamily: "Figtree_600SemiBold", fontSize: 13, color: colors.text }}
              >
                {group.label}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {group.items.length === 0 ? (
                  <Text style={{ fontFamily: "Figtree_400Regular", color: colors.textMuted }}>
                    Nothing picked yet
                  </Text>
                ) : (
                  group.items.map((item) => (
                    <View
                      key={item}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.lavender,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={14} color={brand.success} />
                      <Text
                        style={{
                          fontFamily: "Figtree_500Medium",
                          fontSize: 12,
                          color: colors.text,
                        }}
                      >
                        {item}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Card>
          ))}
          <View style={{ alignSelf: "stretch", gap: 10 }}>
            <Button label={copy.homeLabel} onPress={() => router.replace(copy.home as Href)} />
            {completeness < 100 ? (
              <Button
                label="Complete my profile"
                variant="secondary"
                onPress={() => router.push(copy.edit as Href)}
              />
            ) : null}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  const current = copy.steps[step];
  const selected = step === 0 ? primary : secondary;
  const setSelected = step === 0 ? setPrimary : setSecondary;

  return (
    <Screen>
      <AppHeader title={`Your fit · ${step + 1} of 2`} showBack={step > 0 || router.canGoBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <View>
          <Title>{current.title}</Title>
          <Subtitle>{current.subtitle}</Subtitle>
        </View>
        <ChipPicker
          options={[...current.options]}
          selected={selected}
          onChange={setSelected}
          max={current.max}
        />
        <View style={{ gap: 10, marginTop: 8 }}>
          {step === 0 ? (
            <Button
              label="Continue"
              onPress={() => setStep(1)}
              disabled={primary.length === 0}
            />
          ) : (
            <Button label="Finish" onPress={onFinish} loading={saving} />
          )}
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => router.replace(copy.home as Href)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
