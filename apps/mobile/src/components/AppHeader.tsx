import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";

export function AppHeader({
  title,
  showBack,
  right,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: colors.header,
        borderBottomWidth: 1,
        borderBottomColor: colors.navDivider,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.headerText} />
        </Pressable>
      ) : null}
      <Text
        style={{
          flex: 1,
          fontFamily: "Figtree_600SemiBold",
          fontSize: 20,
          color: colors.headerText,
        }}
      >
        {title}
      </Text>
      {right ?? (
        <Pressable
          onPress={toggleTheme}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
        >
          <Ionicons
            name={theme === "dark" ? "sunny-outline" : "moon-outline"}
            size={22}
            color={colors.headerText}
          />
        </Pressable>
      )}
    </View>
  );
}
