import CategoryList from "@/components/inventory/CategoryList";
import { useTheme } from "@/components/themeProvider";
import { inventoryService } from "@/services/inventory";
import { Category } from "@/types";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoriesScreen() {
  const { colors } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await inventoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleAddCategory = async (name: string) => {
    const newCategory = await inventoryService.createCategory({ name });
    setCategories((prev) => [...prev, newCategory]);
  };

  const handleDeleteCategory = async (id: number) => {
    await inventoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Catégories",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Catégories
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Organisez vos produits par famille.
          </Text>
        </View>
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <CategoryList
            categories={categories}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  intro: { marginBottom: 16 },
  heading: { fontSize: 25, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 5 },
});
