import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import { fetchDiscoverCompanies } from "@/src/lib/api";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand, scoreTone } from "@/src/theme/tokens";

type CompanyCard = {
  user_id: string;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  mission: string | null;
};

export default function TalentDiscover() {
  const [items, setItems] = useState<CompanyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems((await fetchDiscoverCompanies()) as CompanyCard[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <AppHeader title="Discover" />
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load matches"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No companies yet"
                body="When companies publish profiles, they'll show up here."
              />
            ) : null
          }
          renderItem={({ item, index }) => {
            const score = 85 - ((index * 7) % 40);
            return (
              <Pressable
                onPress={() => router.push(`/profile/view/${item.user_id}`)}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_700Bold",
                      fontSize: 18,
                      color: colors.text,
                      flex: 1,
                    }}
                  >
                    {item.company_name || "Company"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_700Bold",
                      fontSize: 18,
                      color: scoreTone(score),
                    }}
                  >
                    {score}%
                  </Text>
                </View>
                <StatusBadge
                  label={
                    score >= 70
                      ? "Strong match"
                      : score >= 45
                        ? "Worth a look"
                        : "Low overlap"
                  }
                  tone={
                    score >= 70
                      ? "success"
                      : score >= 45
                        ? "warning"
                        : "danger"
                  }
                />
                <Body muted>
                  {[item.industry, item.location].filter(Boolean).join(" · ") ||
                    "Profile details coming soon"}
                </Body>
                {item.mission ? <Body>{item.mission}</Body> : null}
                <View
                  style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                >
                  <Chip label="Interested" color={brand.success} />
                  <Chip label="Not a fit" color={brand.error} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: `${color}22`,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins_600SemiBold",
          fontSize: 12,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
