import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

function TabLabel({
  label,
  focused,
  color,
}: {
  label: string;
  focused: boolean;
  color: string | import("react-native").ColorValue;
}) {
  return (
    <Text
      style={{
        fontFamily: focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
        fontSize: 11,
        color: String(color),
      }}
    >
      {label}
    </Text>
  );
}

export default function TalentTabs() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.cta,
        tabBarInactiveTintColor: colors.navIdle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.navDivider,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          title: "Home",
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
          title: "Discover",
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Discover" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          title: "Connect",
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Connect" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          title: "Chat",
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Chat" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
          title: "More",
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="More" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
