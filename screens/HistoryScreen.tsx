import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/themeProvider";
import { inventoryService } from "@/services/inventory";
import { movementService } from "@/services/movements";
import { Product, StockMovement } from "@/types";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [movementData, productData] = await Promise.all([
        movementService.getMovements(),
        inventoryService.getProducts(),
      ]);
      setMovements(movementData);
      setProducts(productData);
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de charger l'historique des mouvements.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={
            movements.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun mouvement enregistré.
            </Text>
          }
          renderItem={({ item }) => {
            const isEntry = item.movement_type === "IN";
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: isEntry ? "#dcfce7" : "#fee2e2" },
                  ]}
                >
                  <Ionicons
                    name={isEntry ? "arrow-down" : "arrow-up"}
                    size={20}
                    color={isEntry ? "#16a34a" : "#dc2626"}
                  />
                </View>
                <View style={styles.details}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {productNames.get(item.product_id) ||
                      `Produit #${item.product_id}`}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {item.reason || "Sans motif"} ·{" "}
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    { color: isEntry ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  {isEntry ? "+" : "-"}
                  {item.quantity}
                </Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 20, gap: 10 },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 15 },
  row: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  details: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 5 },
  amount: { fontSize: 17, fontWeight: "800", marginLeft: 10 },
});
