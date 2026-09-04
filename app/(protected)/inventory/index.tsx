import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { stitchColors, useTheme } from "@/components/themeProvider";
import ProductList from "@/components/inventory/ProductList";
import { inventoryService } from "@/services/inventory";
import { Category, Product } from "@/types";

export default function InventoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.allSettled([
        inventoryService.getProducts(),
        inventoryService.getCategories(),
      ]);
      if (productsData.status === "fulfilled") {
        setProducts(productsData.value);
      }
      if (categoriesData.status === "fulfilled") {
        setCategories(categoriesData.value);
      }
    } catch (error) {
      console.error(error);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: stitchColors.bgDark }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={stitchColors.text} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>INVENTAIRE & FILTRES</Text>
            <Text style={styles.headerSubtitle}>SITE PRINCIPAL • ZONE A & B</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/(protected)/scanner" as any)}
            style={styles.actionBtn}
          >
            <Ionicons name="scan-outline" size={18} color={stitchColors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(protected)/inventory/create" as any)}
            style={[styles.actionBtn, { backgroundColor: stitchColors.primary }]}
          >
            <Ionicons name="add" size={20} color="#0B0F17" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={stitchColors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <ProductList
            products={products}
            categories={categories}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: stitchColors.border,
    backgroundColor: "rgba(11,15,23,0.95)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: stitchColors.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
