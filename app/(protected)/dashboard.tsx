import { useTheme } from "@/components/themeProvider";
import DashboardStats from "@/components/inventory/DashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryService } from "@/services/inventory";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await inventoryService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.appBar}>
        <View style={styles.appBarTitle}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("dashboard.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {user?.email ?? t("dashboard.userFallback")}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Se déconnecter"
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.appBarSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <DashboardStats products={products} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gestion</Text>
            
            <Pressable 
              style={[styles.menuCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(protected)/inventory')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="cube" size={24} color={colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Produits</Text>
                <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Gérer le stock et les articles</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable 
              style={[styles.menuCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(protected)/categories')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="pricetags" size={24} color={colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Catégories</Text>
                <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Organiser les produits</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  appBarTitle: { flex: 1, alignItems: "center" },
  appBarSpacer: { width: 10 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 3 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 13,
  }
});
