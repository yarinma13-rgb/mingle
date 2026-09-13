import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Body, Screen, Title } from "@/src/components/ui";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: true }} />
      <Screen style={{ padding: 24, justifyContent: "center" }}>
        <Title>Screen not found</Title>
        <View style={{ height: 12 }} />
        <Body muted>This route is not in the mobile app yet.</Body>
        <View style={{ height: 16 }} />
        <Link href="/">
          <Body>Go home</Body>
        </Link>
      </Screen>
    </>
  );
}
