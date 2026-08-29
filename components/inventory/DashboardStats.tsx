import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Product } from "../../types";
import { useTheme } from "../themeProvider";

interface DashboardStatsProps {
  products: Product[];
}

export default function DashboardStats({ products }: DashboardStatsProps) {
  const { colors } = useTheme();

  const totalProducts = products.length;
  const totalQuantity = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );
  const outOfStockProducts = products.filter((p) => p.quantity === 0);

  return (
    <View style={styles.container}>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="cube-outline" size={32} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {totalProducts}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Produits
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="layers-outline" size={32} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {totalQuantity}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Unités
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color={outOfStockProducts.length > 0 ? "#ef4444" : "#22c55e"}
        />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {outOfStockProducts.length}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Ruptures
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
