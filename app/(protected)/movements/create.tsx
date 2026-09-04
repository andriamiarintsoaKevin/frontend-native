import { Ionicons } from "@expo/vector-icons";
import {
    Stack,
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/themeProvider";
import { inventoryService } from "@/services/inventory";
import { movementService } from "@/services/movements";
import { MovementType, Product } from "@/types";

function getApiError(error: unknown) {
  const responseData = (
    error as { response?: { data?: { detail?: string; message?: string } } }
  )?.response?.data;
  return (
    responseData?.detail ||
    responseData?.message ||
    "Impossible d'enregistrer le mouvement."
  );
}

export default function CreateMovementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { movementType: requestedMovementType } = useLocalSearchParams<{
    movementType?: string;
  }>();
  const initialMovementType: MovementType =
    requestedMovementType === "OUT" ? "OUT" : "IN";
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] =
    useState<MovementType>(initialMovementType);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedProduct(null);
    setMovementType(initialMovementType);
    setQuantity("");
    setReason("");
    setSubmitting(false);
    setShowProducts(false);
  }, [initialMovementType]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setProducts([]);
    try {
      const productData = await inventoryService.getProducts();
      setProducts(productData);
    } catch (error) {
      Alert.alert("Erreur", getApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();
      loadProducts();
    }, [loadProducts, resetForm]),
  );

  const handleSubmit = async () => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!selectedProduct) {
      Alert.alert("Produit requis", "Sélectionnez un produit.");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert(
        "Quantité invalide",
        "Saisissez une quantité entière supérieure à zéro.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await movementService.createMovement({
        product_id: selectedProduct.id,
        quantity: parsedQuantity,
        movement_type: movementType,
        reason: reason.trim() || null,
      });
      Alert.alert("Mouvement enregistré", "Le stock a été mis à jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Erreur", getApiError(error));
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
          title: "Mouvement de stock",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={[styles.heading, { color: colors.text }]}>
              Nouveau mouvement
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Actualisez vos quantités en quelques secondes.
            </Text>
          </View>
          <Pressable
            onPress={resetForm}
            style={[styles.resetButton, { borderColor: colors.border }]}
            accessibilityLabel="Réinitialiser le formulaire"
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>
              Reset
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Produit</Text>
        <Pressable
          onPress={() => setShowProducts((visible) => !visible)}
          style={[
            styles.selector,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.selectorText,
              { color: selectedProduct ? colors.text : colors.textMuted },
            ]}
          >
            {selectedProduct?.name ||
              (loading ? "Chargement..." : "Sélectionner un produit")}
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons
              name={showProducts ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          )}
        </Pressable>
        {showProducts && (
          <View
            style={[
              styles.productMenu,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {products.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Aucun produit disponible.
              </Text>
            ) : (
              products.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => {
                    setSelectedProduct(product);
                    setShowProducts(false);
                  }}
                  style={[
                    styles.productOption,
                    { borderBottomColor: colors.line },
                  ]}
                >
                  <Text style={[styles.optionName, { color: colors.text }]}>
                    {product.name}
                  </Text>
                  <Text
                    style={[styles.optionStock, { color: colors.textMuted }]}
                  >
                    {product.quantity} en stock
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>
          Type de mouvement
        </Text>
        <View style={styles.typeRow}>
          {(["IN", "OUT"] as MovementType[]).map((type) => {
            const active = movementType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setMovementType(type)}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: active
                      ? type === "IN"
                        ? colors.primarySoft
                        : colors.surfaceMuted
                      : colors.surface,
                    borderColor: active
                      ? type === "IN"
                        ? colors.stitchTertiary
                        : colors.stitchError
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={type === "IN" ? "arrow-down" : "arrow-up"}
                  size={18}
                  color={
                    type === "IN" ? colors.stitchTertiary : colors.stitchError
                  }
                />
                <Text style={[styles.typeText, { color: colors.text }]}>
                  {type === "IN" ? "Entrée" : "Sortie"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Quantité</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>
          Motif <Text style={{ color: colors.textMuted }}>(facultatif)</Text>
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Achat fournisseur, vente..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.reasonInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          multiline
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.onPrimary}
              />
              <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                Confirmer le mouvement
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 25, fontWeight: "700" },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCopy: { flex: 1 },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 28 },
  resetButton: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  resetButtonText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 18 },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: { fontSize: 15 },
  productMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  productOption: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionName: { fontSize: 15, fontWeight: "600" },
  optionStock: { fontSize: 13 },
  emptyText: { padding: 15 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  typeText: { fontSize: 15, fontWeight: "600" },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  reasonInput: { minHeight: 92, paddingTop: 14, textAlignVertical: "top" },
  submitButton: {
    minHeight: 54,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: { fontSize: 15, fontWeight: "700" },
});
