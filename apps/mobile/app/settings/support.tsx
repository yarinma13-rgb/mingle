import { Linking, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Card, Screen, Subtitle, Title } from "@/src/components/ui";
import { brand } from "@/src/theme/tokens";

export default function SupportScreen() {
  return (
    <Screen>
      <AppHeader title="Support" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Support</Title>
        <Subtitle>We are here if something in mingle feels stuck.</Subtitle>
        <Card>
          <Body muted>Email</Body>
          <Pressable onPress={() => void Linking.openURL("mailto:hello@mingle.careers")}>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                color: brand.cta,
                marginTop: 6,
              }}
            >
              hello@mingle.careers
            </Text>
          </Pressable>
        </Card>
        <Card>
          <Body>
            For account or matching issues, include the email you signed up with
            and what you were trying to do.
          </Body>
        </Card>
      </View>
    </Screen>
  );
}
