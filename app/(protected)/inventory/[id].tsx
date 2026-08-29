import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/themeProvider';
import ProductForm from '@/components/inventory/ProductForm';
import { inventoryService } from '@/services/inventory';
import { Category, Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const productId = parseInt(id as string, 10);
  const router = useRouter();
  const { colors } = useTheme();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoriesData] = await Promise.all([
          inventoryService.getProduct(productId),
          inventoryService.getCategories()
        ]);
        setProduct(productData);
        setCategories(categoriesData);
      } catch (error) {
        console.error(error);
        Alert.alert("Erreur", "Impossible de charger le produit");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleSubmit = async (productData: Partial<Product>) => {
    setSubmitting(true);
    try {
      await inventoryService.updateProduct(productId, productData);
      router.back();
    } catch (error: any) {
      throw new Error(error.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer le produit",
      "Êtes-vous sûr de vouloir supprimer ce produit ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await inventoryService.deleteProduct(productId);
              router.back();
            } catch (error: any) {
              Alert.alert("Erreur", "Impossible de supprimer le produit");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Modifier le produit",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={handleDelete} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </Pressable>
          ),
        }} 
      />
      
      {loading || !product ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ProductForm 
          initialData={product}
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
  headerButton: {
    padding: 8,
  }
});
