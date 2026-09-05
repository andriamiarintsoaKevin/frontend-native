import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProductForm from "@/components/inventory/ProductForm";
import { useTheme } from "@/components/themeProvider";
import { inventoryService } from "@/services/inventory";
import { Category, Product } from "@/types";

function getApiError(error: unknown) {
  const responseData = (
    error as { response?: { data?: { detail?: string; message?: string } } }
  )?.response?.data;
  return (
    responseData?.detail || responseData?.message || "Modification impossible."
  );
}

export default function EditProductScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const parsedProductId = Number(productId);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!Number.isInteger(parsedProductId)) {
        setLoading(false);
        return;
      }

      try {
        const [productData, categoryData] = await Promise.all([
          inventoryService.getProduct(parsedProductId),
          inventoryService.getCategories(),
        ]);
        setProduct(productData);
        setCategories(categoryData);
      } catch (error) {
        Alert.alert("Erreur", getApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [parsedProductId]);

  const handleSubmit = async (
    productData: Omit<Product, "id" | "category">,
  ) => {
    if (!product) return;

    setSubmitting(true);
    try {
      await inventoryService.updateProduct(product.id, productData);
      router.back();
    } catch (error) {
      throw new Error(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Modifier le produit",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : product ? (
        <ProductForm
          initialData={product}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={submitting}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: colors.text }}>Produit introuvable.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 40 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
});
