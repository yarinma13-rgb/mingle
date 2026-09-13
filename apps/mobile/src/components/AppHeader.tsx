import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import { ThemeToggle } from "@/src/components/ui";

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
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: colors.productBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.navDivider,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {showBack ? (
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            ←
          </Text>
        </Pressable>
      ) : null}
      <Text
        style={{
          flex: 1,
          fontFamily: "Poppins_700Bold",
          fontSize: 18,
          color: colors.text,
        }}
      >
        {title}
      </Text>
      {right ?? <ThemeToggle />}
    </View>
  );
}
