import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Card, Screen, Subtitle, Title } from "@/src/components/ui";

export default function ConversationOpportunityTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <AppHeader title="Opportunity" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Opportunity</Title>
        <Subtitle>Capture the role, timing, and what success looks like.</Subtitle>
        <Card>
          <Body muted>Connection {id?.slice(0, 8)}</Body>
          <Body>
            This relationship stage view is wired in the mobile shell. Next
            iteration pulls the full Explore / Opportunity / Decision content
            from the same Supabase tables as the web app.
          </Body>
        </Card>
      </View>
    </Screen>
  );
}
