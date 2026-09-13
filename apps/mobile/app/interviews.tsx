import { View } from "react-native";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Card, Screen, Subtitle, Title } from "@/src/components/ui";

export default function ScreenShell() {
  return (
    <Screen>
      <AppHeader title="Interviews" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Interviews</Title>
        <Subtitle>Upcoming and past conversations.</Subtitle>
        <Card>
          <Body>
            Native screen shell is in place. Data forms and editors from the web
            product land here next, against the same Supabase schema.
          </Body>
        </Card>
      </View>
    </Screen>
  );
}
