import HistoryScreen from "@/screens/HistoryScreen";
import { Stack } from "expo-router";

export default function MovementHistoryRoute() {
  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: "Historique des mouvements" }}
      />
      <HistoryScreen />
    </>
  );
}
