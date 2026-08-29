import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function StockMovementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    inventoryService
      .getProducts()
      .then(setProducts)
      .catch((error) => Alert.alert("Erreur", getApiError(error)))
      .finally(() => setLoading(false));
  }, []);

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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.text }]}>
          Nouveau mouvement
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Actualisez vos quantités en quelques secondes.
        </Text>

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
                        ? "#dcfce7"
                        : "#fee2e2"
                      : colors.surface,
                    borderColor: active
                      ? type === "IN"
                        ? "#22c55e"
                        : "#ef4444"
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={type === "IN" ? "arrow-down" : "arrow-up"}
                  size={18}
                  color={type === "IN" ? "#16a34a" : "#dc2626"}
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
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 28 },
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
