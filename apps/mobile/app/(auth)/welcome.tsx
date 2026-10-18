import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";
import mingleMark from "../../assets/images/mingle-mark.png";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, toggleTheme, theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          zIndex: 1,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable
            onPress={toggleTheme}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
              {theme === "dark" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 14 }}>
          <Image
            source={mingleMark}
            alt="mingle"
            accessibilityLabel="mingle"
            style={{ width: 112, height: 112, borderRadius: 28 }}
          />
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 40,
              color: colors.text,
              letterSpacing: -1,
              marginTop: 8,
            }}
          >
            mingle
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
              color: brand.accentPurple,
            }}
          >
            Beyond the match.
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 15,
              lineHeight: 23,
              color: colors.textSecondary,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            Career relationships, not a job board. Match on values, work style
            and ambition.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 }}>
            {["Values", "Work style", "Ambition"].map((label) => (
              <View
                key={label}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: colors.text }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Link href="/(auth)/path" asChild>
            <Pressable style={{ borderRadius: 999, overflow: "hidden" }}>
              <LinearGradient
                colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
                  Get started
                </Text>
              </LinearGradient>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              style={{
                paddingVertical: 14,
                alignItems: "center",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: brand.cta, fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
                I already have an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
