import StockMovementScreen from "@/screens/StockMovementScreen";
import { Stack } from "expo-router";

export default function CreateMovementRoute() {
  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: "Mouvement de stock" }}
      />
      <StockMovementScreen />
    </>
  );
}
