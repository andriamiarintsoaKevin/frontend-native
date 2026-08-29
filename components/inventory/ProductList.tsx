import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable } from 'react-native';
import { Product, Category } from '../../types';
import { useTheme } from '../themeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  refreshing: boolean;
}

export default function ProductList({ products, categories, onRefresh, refreshing }: ProductListProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stock_quantity <= 5;
    
    return (
      <Pressable 
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/(protected)/inventory/${item.id}` as any)}
      >
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>{item.unit_price} €</Text>
        </View>
        <View style={styles.stockContainer}>
          <Text style={[styles.stockText, { color: isLowStock ? '#ef4444' : colors.textMuted }]}>
            {item.stock_quantity} en stock
          </Text>
          {isLowStock && <Ionicons name="warning" size={16} color="#ef4444" />}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un produit..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: -1, name: 'Tous' } as Category, ...categories]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isSelected = item.id === -1 ? selectedCategory === null : selectedCategory === item.id;
            return (
              <Pressable
                style={[
                  styles.filterBadge, 
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setSelectedCategory(item.id === -1 ? null : item.id)}
              >
                <Text style={{ color: isSelected ? colors.onPrimary : colors.text, fontSize: 12 }}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun produit trouvé</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: '100%',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stockContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  stockText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
  }
});
