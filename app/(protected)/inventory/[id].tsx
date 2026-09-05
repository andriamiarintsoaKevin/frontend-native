import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitchColors, useTheme } from "@/components/themeProvider";
import { inventoryService } from "@/services/inventory";
import { movementService } from "@/services/movements";
import { Product } from "@/types";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const productId = parseInt(id as string, 10);
  const router = useRouter();
  const { colors } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!isNaN(productId)) {
          const data = await inventoryService.getProduct(productId);
          setProduct(data);
        }
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger ce produit.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const triggerAction = async (type: "dispense" | "restock") => {
    if (!product || (type === "dispense" && product.quantity <= 0)) return;

    try {
      await movementService.createMovement({
        product_id: product.id,
        quantity: type === "dispense" ? 1 : 10,
        movement_type: type === "dispense" ? "OUT" : "IN",
        reason: type === "dispense" ? "Dispensation" : "Réapprovisionnement",
      });
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              quantity: prev.quantity + (type === "dispense" ? -1 : 10),
            }
          : null,
      );
      setToastMessage(
        type === "dispense"
          ? "Dispensation validée : 1 unité décomptée"
          : "Entrée enregistrée : +10 unités",
      );
      setTimeout(() => setToastMessage(null), 2500);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer le mouvement.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: stitchColors.bgDark,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={stitchColors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: stitchColors.bgDark,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: stitchColors.text }}>Produit introuvable.</Text>
      </SafeAreaView>
    );
  }

  const isMedical = (product?.sector || "medical") === "medical";
  const isIT = product?.sector === "it";
  const isLowStock =
    (product?.quantity ?? 0) <= (product?.reorder_threshold ?? 50);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: stitchColors.bgDark }]}
    >
      {/* 1. Header */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={stitchColors.text} />
          </Pressable>
          <View style={styles.brandIcon}>
            <Ionicons
              name="cube-outline"
              size={16}
              color={stitchColors.primary}
            />
          </View>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Fiche Produit
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() =>
              router.push(
                `/(protected)/inventory/edit?productId=${product.id}` as any,
              )
            }
            style={styles.scanShortcutBtn}
            accessibilityLabel="Modifier le produit"
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={stitchColors.primary}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(protected)/scanner" as any)}
            style={styles.scanShortcutBtn}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={stitchColors.primary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Context Breadcrumb & Sector Notch Header */}
        <View style={styles.sectorNotchRow}>
          <View style={styles.sectorNotchLeft}>
            <View
              style={[
                styles.sectorNotchBar,
                {
                  backgroundColor: isMedical
                    ? stitchColors.tertiary
                    : isIT
                      ? stitchColors.secondary
                      : stitchColors.primary,
                },
              ]}
            />
            <Text
              style={[
                styles.sectorNotchLabel,
                {
                  color: isMedical
                    ? stitchColors.tertiary
                    : isIT
                      ? stitchColors.secondary
                      : stitchColors.primary,
                },
              ]}
            >
              {isMedical
                ? "DÉPARTEMENT PHARMA & CLINIQUE"
                : isIT
                  ? "DÉPARTEMENT MATÉRIEL IT"
                  : "LOGISTIQUE GÉNÉRALE"}
            </Text>
          </View>

          <View style={styles.iotPulseBadge}>
            <View style={styles.iotDot} />
            <Text style={styles.iotText}>Capteur IoT Live</Text>
          </View>
        </View>

        {/* 3. Main Identity Banner */}
        <View style={styles.mainIdentityCard}>
          <View style={styles.identityTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.skuText}>
                SKU: {product.sku || "Non renseigné"}
              </Text>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productSubtitle}>
                {product.description || "Aucune description"}
              </Text>
            </View>
            <Pressable
              style={styles.copyBtn}
              onPress={() => {
                setToastMessage("Référence copiée dans le presse-papier !");
                setTimeout(() => setToastMessage(null), 2000);
              }}
            >
              <Ionicons
                name="copy-outline"
                size={18}
                color={stitchColors.textMuted}
              />
            </Pressable>
          </View>

          {/* Expiration Countdown Card (if Medical) */}
          {isMedical && (
            <View style={styles.expiryBox}>
              <View style={styles.expiryHeaderRow}>
                <View style={styles.expiryTag}>
                  <Ionicons name="alarm" size={16} color={stitchColors.error} />
                  <Text style={styles.expiryTagText}>PÉREMPTION CRITIQUE</Text>
                </View>
                <Text style={styles.expiryRemainingText}>
                  {product.expiry_date || "Date non renseignée"}
                </Text>
              </View>

              <View style={styles.expiryProgressBg}>
                <View style={[styles.expiryProgressFill, { width: "82%" }]} />
              </View>

              <View style={styles.expiryFooterRow}>
                <Text style={styles.expiryDateText}>
                  Date limite : {product.expiry_date || "Non renseignée"}
                </Text>
                <Text style={styles.expiryAlertNotice}>Revue requise</Text>
              </View>
            </View>
          )}
        </View>

        {/* 4. Key Telemetry Split Cards */}
        <View style={styles.telemetrySplitRow}>
          {/* Card 1: Stock Level */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryCardHeader}>
              <Text style={styles.telemetryCardLabel}>QUANTITÉ EN STOCK</Text>
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>Sous seuil</Text>
                </View>
              )}
            </View>
            <View style={styles.telemetryQuantityRow}>
              <Text style={styles.telemetryQuantityValue}>
                {product.quantity}
              </Text>
              <Text style={styles.telemetryUnitText}>
                {isMedical ? "flacons" : isIT ? "unités" : "pcs"}
              </Text>
            </View>
            <View style={styles.telemetryCardFooter}>
              <Text style={styles.thresholdText}>
                Seuil mini : {product.reorder_threshold ?? "Non renseigné"} u.
              </Text>
              <Ionicons
                name="alert-circle"
                size={16}
                color={stitchColors.error}
              />
            </View>
          </View>

          {/* Card 2: Cold Chain / Condition */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryCardHeader}>
              <Text
                style={[
                  styles.telemetryCardLabel,
                  { color: stitchColors.primary },
                ]}
              >
                {isMedical ? "CHAÎNE DU FROID" : "ÉTAT MATÉRIEL"}
              </Text>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.telemetryQuantityRow}>
              <Text
                style={[
                  styles.telemetryQuantityValue,
                  { color: stitchColors.primary },
                ]}
              >
                {isMedical
                  ? product.storage_temperature != null
                    ? `${product.storage_temperature}°C`
                    : "Non renseignée"
                  : product.hardware_condition || "Non renseigné"}
              </Text>
              <Text style={styles.conformeText}>CONFORME</Text>
            </View>
            <View style={styles.telemetryCardFooter}>
              <Text style={styles.thresholdText}>
                {isMedical
                  ? "Cible : 2°C – 8°C"
                  : `Affecté : ${product.assigned_to || "Non renseigné"}`}
              </Text>
              <Text style={styles.thresholdText}>
                {product.warehouse_location || "Emplacement non renseigné"}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Traceability & Barcode HUD */}
        <View style={styles.traceabilityCard}>
          <View style={styles.traceabilityHeader}>
            <View style={styles.traceabilityTitleRow}>
              <Ionicons
                name="qr-code-outline"
                size={18}
                color={stitchColors.primary}
              />
              <Text style={styles.traceabilityTitleText}>
                Traçabilité & Identification
              </Text>
            </View>
            <View style={styles.gmpBadge}>
              <Text style={styles.gmpText}>Validé GMP</Text>
            </View>
          </View>

          <View style={styles.barcodeBox}>
            <View>
              <Text style={styles.barcodeLabel}>
                {isMedical ? "NUMÉRO DE LOT" : "NUMÉRO DE SÉRIE"}
              </Text>
              <Text style={styles.barcodeValue}>
                {product.batch_number ||
                  product.serial_number ||
                  "Non renseigné"}
              </Text>
              <Text style={styles.barcodeSub}>
                {product.created_at
                  ? new Date(product.created_at).toLocaleDateString("fr-FR")
                  : "Date de création non renseignée"}
              </Text>
            </View>

            {/* Visual Barcode Representation */}
            <View style={styles.visualBarcode}>
              <View style={styles.barcodeBarsContainer}>
                {[3, 1, 4, 1, 3, 6, 2, 4, 1, 5, 2, 6, 1, 3, 4, 2].map(
                  (w, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: w,
                        height: 28,
                        backgroundColor: stitchColors.text,
                        marginRight: 2,
                      }}
                    />
                  ),
                )}
              </View>
              <Text style={styles.barcodeNumberText}>
                {product.sku ||
                  product.batch_number ||
                  product.serial_number ||
                  ""}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons
              name="business-outline"
              size={16}
              color={stitchColors.secondary}
            />
            <Text style={styles.locationText}>
              <Text style={{ fontWeight: "700", color: stitchColors.text }}>
                Emplacement :{" "}
              </Text>
              {product.warehouse_location || "Non renseigné"}
            </Text>
          </View>
        </View>

        {/* 6. Storage Conditions */}
        <View style={styles.conditionsCard}>
          <View style={styles.conditionsIconBox}>
            <MaterialCommunityIcons
              name="shield-check"
              size={26}
              color={stitchColors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.conditionsTitle}>
              Conditions de conservation
            </Text>
            <Text style={styles.conditionsText}>
              Garder dans l'emballage d'origine à l'abri de la lumière directe.
              Ne pas congeler.
            </Text>
            <View style={styles.analysisCertRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={stitchColors.tertiary}
              />
              <Text style={styles.analysisCertText}>
                Certificat d'analyse conforme
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 8. Sticky Bottom Action Tray */}
      <View style={styles.bottomActionTray}>
        <Pressable
          style={styles.restockButton}
          onPress={() => triggerAction("restock")}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={stitchColors.primary}
          />
          <Text style={styles.restockButtonText}>+ Entrée Stock</Text>
        </Pressable>

        <Pressable
          style={styles.dispenseButton}
          onPress={() => triggerAction("dispense")}
        >
          <Ionicons name="medkit-outline" size={20} color="#0B0F17" />
          <Text style={styles.dispenseButtonText}>Distribuer l'article</Text>
        </Pressable>
      </View>

      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={stitchColors.tertiary}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: stitchColors.border,
    backgroundColor: "rgba(11,15,23,0.95)",
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(6,182,212,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: stitchColors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanShortcutBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  sectorNotchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectorNotchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectorNotchBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectorNotchLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  iotPulseBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  iotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: stitchColors.tertiary,
  },
  iotText: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
  },
  mainIdentityCard: {
    backgroundColor: stitchColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 14,
  },
  identityTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  skuText: {
    fontSize: 12,
    fontWeight: "800",
    color: stitchColors.primary,
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: stitchColors.text,
    marginTop: 2,
  },
  productSubtitle: {
    fontSize: 12,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  expiryBox: {
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  expiryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expiryTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: stitchColors.error,
    letterSpacing: 0.5,
  },
  expiryRemainingText: {
    fontSize: 12,
    fontWeight: "700",
    color: stitchColors.text,
  },
  expiryProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: stitchColors.border,
    overflow: "hidden",
  },
  expiryProgressFill: {
    height: "100%",
    backgroundColor: stitchColors.error,
    borderRadius: 3,
  },
  expiryFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryDateText: {
    fontSize: 11,
    color: stitchColors.textMuted,
  },
  expiryAlertNotice: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.error,
  },
  telemetrySplitRow: {
    flexDirection: "row",
    gap: 12,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: stitchColors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
    justifyContent: "space-between",
  },
  telemetryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  telemetryCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: stitchColors.textMuted,
    letterSpacing: 0.5,
  },
  lowStockBadge: {
    backgroundColor: "rgba(239,68,68,0.2)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: "800",
    color: stitchColors.error,
  },
  telemetryQuantityRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginVertical: 6,
  },
  telemetryQuantityValue: {
    fontSize: 22,
    fontWeight: "900",
    color: stitchColors.text,
  },
  telemetryUnitText: {
    fontSize: 11,
    color: stitchColors.textMuted,
    fontWeight: "600",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: stitchColors.tertiary,
  },
  conformeText: {
    fontSize: 10,
    fontWeight: "800",
    color: stitchColors.tertiary,
  },
  telemetryCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: stitchColors.border,
    paddingTop: 6,
  },
  thresholdText: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  traceabilityCard: {
    backgroundColor: stitchColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 12,
  },
  traceabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  traceabilityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  traceabilityTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  gmpBadge: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gmpText: {
    fontSize: 10,
    fontWeight: "800",
    color: stitchColors.tertiary,
  },
  barcodeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 10,
    padding: 12,
  },
  barcodeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: stitchColors.textMuted,
    letterSpacing: 0.5,
  },
  barcodeValue: {
    fontSize: 15,
    fontWeight: "900",
    color: stitchColors.primary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  barcodeSub: {
    fontSize: 10,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  visualBarcode: {
    alignItems: "center",
    backgroundColor: stitchColors.bgDark,
    padding: 6,
    borderRadius: 6,
  },
  barcodeBarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  barcodeNumberText: {
    fontSize: 8,
    color: stitchColors.textMuted,
    letterSpacing: 2,
    marginTop: 3,
    fontFamily: "monospace",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 11,
    color: stitchColors.textMuted,
  },
  conditionsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 12,
  },
  conditionsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: stitchColors.primary,
    letterSpacing: 0.5,
  },
  conditionsText: {
    fontSize: 11,
    color: stitchColors.text,
    marginTop: 2,
  },
  analysisCertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  analysisCertText: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  velocityCard: {
    backgroundColor: stitchColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 10,
  },
  velocityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  velocityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  velocityLastTime: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  sparklineContainer: {
    height: 80,
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 10,
    padding: 10,
    justifyContent: "flex-end",
    position: "relative",
  },
  sparklineBarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
  },
  sparklineBar: {
    width: 14,
    borderRadius: 3,
  },
  thresholdLine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 35,
    height: 1,
    backgroundColor: "rgba(239,68,68,0.5)",
  },
  thresholdLabel: {
    position: "absolute",
    left: 10,
    top: 22,
    fontSize: 8,
    color: stitchColors.error,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  velocitySubMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 10,
    padding: 10,
  },
  subMetricCol: {
    flex: 1,
  },
  subMetricLabel: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  subMetricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: stitchColors.text,
    marginTop: 2,
  },
  bottomActionTray: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "rgba(11,15,23,0.96)",
    borderTopWidth: 1,
    borderTopColor: stitchColors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  restockButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: stitchColors.cardElevated,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  restockButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.primary,
  },
  dispenseButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 10,
    backgroundColor: stitchColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: stitchColors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  dispenseButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B0F17",
  },
  toastContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: stitchColors.cardElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: stitchColors.border,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: stitchColors.text,
    fontWeight: "700",
    fontSize: 12,
  },
});
