import { Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Screen,
  Subtitle,
  ThemeToggle,
  Title,
} from "@/src/components/ui";
import { brand } from "@/src/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <LinearGradient
        colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: 0.18 }}
      />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <ThemeToggle />
        </View>
        <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
          <Image
            source={require("../../assets/images/mingle-mark.png")}
            style={{ width: 88, height: 88, borderRadius: 20 }}
          />
          <Title>mingle</Title>
          <Subtitle>
            Career relationships — not a job board. Match on values, work
            style, and ambition. Then stay connected through the whole journey.
          </Subtitle>
        </View>
        <View style={{ gap: 12 }}>
          <Button
            label="Get started"
            onPress={() => router.push("/(auth)/path")}
          />
          <Button
            label="I already have an account"
            variant="secondary"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </View>
      </View>
    </Screen>
  );
}
