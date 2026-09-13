import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AppHeader } from "@/src/components/AppHeader";
import { Screen, Subtitle, Title } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";
import type { UserType } from "@/src/types/models";

export default function PathScreen() {
  const router = useRouter();
  const { setPathPreference } = useAuth();
  const { colors } = useTheme();

  function choose(path: UserType) {
    setPathPreference(path);
    router.push({ pathname: "/(auth)/sign-up", params: { path } });
  }

  return (
    <Screen>
      <AppHeader title="Who are you?" showBack />
      <View style={{ padding: 24, gap: 16 }}>
        <Title>Choose your path</Title>
        <Subtitle>
          One tap — we take you straight into sign up for that side of mingle.
        </Subtitle>
        <PathCard
          title="Talent"
          body="Find companies that fit how you work and grow."
          gradient={[brand.accentPink, brand.accentPurple]}
          onPress={() => choose("talent")}
          textColor={colors.text}
          surface={colors.surface}
          border={colors.border}
        />
        <PathCard
          title="Company"
          body="Meet people who match your culture and role DNA."
          gradient={[brand.accentPurple, brand.accentBlue]}
          onPress={() => choose("company")}
          textColor={colors.text}
          surface={colors.surface}
          border={colors.border}
        />
      </View>
    </Screen>
  );
}

function PathCard(props: {
  title: string;
  body: string;
  gradient: [string, string];
  onPress: () => void;
  textColor: string;
  surface: string;
  border: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: props.border,
        backgroundColor: props.surface,
      })}
    >
      <LinearGradient
        colors={[`${props.gradient[0]}22`, `${props.gradient[1]}11`]}
        style={{ padding: 20, gap: 8 }}
      >
        <Text
          style={{
            fontFamily: "Poppins_700Bold",
            fontSize: 22,
            color: props.textColor,
          }}
        >
          {props.title}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
            lineHeight: 20,
            color: props.textColor,
            opacity: 0.75,
          }}
        >
          {props.body}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
