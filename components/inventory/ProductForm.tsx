import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Category, Product } from '../../types';
import { useTheme } from '../themeProvider';

interface ProductFormProps {
  initialData?: Partial<Product>;
  categories: Category[];
  onSubmit: (data: Omit<Product, 'id' | 'category'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ProductForm({ initialData, categories, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { colors } = useTheme();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.unit_price !== undefined ? initialData.unit_price.toString() : '');
  const [quantity, setQuantity] = useState(initialData?.stock_quantity !== undefined ? initialData.stock_quantity.toString() : '0');
  const [categoryId, setCategoryId] = useState<number | undefined>(initialData?.category_id);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!name.trim() || price === '' || quantity === '' || !categoryId) {
      setError('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Le prix unitaire doit être positif ou nul.');
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError('La quantité en stock ne peut pas être négative.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        unit_price: parsedPrice,
        stock_quantity: parsedQuantity,
        category_id: categoryId,
      });
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={[styles.label, { color: colors.text }]}>Nom du produit *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Nom"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>Catégorie *</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        {/* Simple mock picker. For a real app, use @react-native-picker/picker or a custom modal */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: categoryId === cat.id ? colors.primary : colors.surface,
                  borderColor: categoryId === cat.id ? colors.primary : colors.border
                }
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={{ color: categoryId === cat.id ? colors.onPrimary : colors.text }}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Prix (€) *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>Quantité *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description détaillée..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
      />

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Enregistrer</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
