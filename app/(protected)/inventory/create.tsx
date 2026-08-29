import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/components/themeProvider';
import ProductForm from '@/components/inventory/ProductForm';
import { inventoryService } from '@/services/inventory';
import { Category, Product } from '@/types';

export default function CreateProductScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await inventoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (productData: Omit<Product, 'id' | 'category'>) => {
    setSubmitting(true);
    try {
      await inventoryService.createProduct(productData);
      router.back();
    } catch (error: any) {
      throw new Error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Nouveau produit",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ProductForm 
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={submitting}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
