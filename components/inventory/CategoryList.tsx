import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Category } from '../../types';
import { useTheme } from '../themeProvider';
import { Ionicons } from '@expo/vector-icons';

interface CategoryListProps {
  categories: Category[];
  onRefresh: () => void;
  refreshing: boolean;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export default function CategoryList({ categories, onRefresh, refreshing, onAddCategory, onDeleteCategory }: CategoryListProps) {
  const { colors } = useTheme();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    setIsAdding(true);
    try {
      await onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d\'ajouter la catégorie');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      "Supprimer",
      `Voulez-vous vraiment supprimer la catégorie "${name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => onDeleteCategory(id).catch(e => Alert.alert("Erreur", e.message))
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.addContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Nouvelle catégorie..."
          placeholderTextColor={colors.textMuted}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Ionicons name="add" size={24} color={colors.onPrimary} />
          )}
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
            <Pressable onPress={() => handleDelete(item.id, item.name)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textMuted }}>Aucune catégorie</Text>
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
  addContainer: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  }
});
