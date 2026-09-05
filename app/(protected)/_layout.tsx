import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "@/components/themeProvider";

export default function ProtectedLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: "Inventaire",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="movements/history"
        options={{
          title: "Mouvements",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="swap-horizontal-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{
          title: "Catégories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="inventory/create" options={{ href: null }} />
      <Tabs.Screen name="inventory/edit" options={{ href: null }} />
      <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
      <Tabs.Screen name="movements/create" options={{ href: null }} />
    </Tabs>
  );
}
