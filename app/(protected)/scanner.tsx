import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitchColors, useTheme } from "@/components/themeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryService } from "@/services/inventory";
import { movementService } from "@/services/movements";
import { Product } from "@/types";

export default function ScannerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  // État local
  const [selectedSector, setSelectedSector] = useState<"pharma" | "it">(
    "pharma",
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const resetScannerForm = useCallback(() => {
    setSelectedSector("pharma");
    setQuantity(1);
    setReason("");
    setNote("");
    setTorchActive(false);
    setSubmitting(false);
    setToastMessage(null);
    setScannedCode(null);
    setScannedProduct(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetScannerForm();
      };
    }, [resetScannerForm]),
  );

  // Animation du laser de scan
  const [laserAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [laserAnim]);

  const handleAdjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSetDirectQuantity = (step: number) => {
    setQuantity((prev) => prev + step);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedCode === data) return;
    setScannedCode(data);
    inventoryService
      .scanProduct(data)
      .then((product) => {
        setScannedProduct(product);
        setSelectedSector(product.sector === "it" ? "it" : "pharma");
        setToastMessage(`Produit trouvé : ${product.name}`);
      })
      .catch(() => {
        setScannedProduct(null);
        setToastMessage("Aucun produit correspondant dans la base.");
      });
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleConfirmMovement = async () => {
    if (submitting || !scannedProduct) return;
    setSubmitting(true);
    try {
      await movementService.createMovement({
        product_id: scannedProduct.id,
        quantity: quantity,
        movement_type: "OUT",
        reason: [reason, note.trim()].filter(Boolean).join(" - ") || null,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setToastMessage(`Mouvement Validé ! ${quantity} unités transférées.`);

      setTimeout(() => {
        setToastMessage(null);
        router.replace("/(protected)/dashboard");
      }, 1800);
    } catch {
      setToastMessage("Impossible d'enregistrer le mouvement.");
      setTimeout(() => setToastMessage(null), 2200);
    } finally {
      setSubmitting(false);
    }
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 130],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={stitchColors.text} />
        </Pressable>

        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Ionicons
              name="scan-outline"
              size={18}
              color={stitchColors.primary}
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>OMNISTOCK</Text>
            <Text style={styles.brandSubtitle}>SCANNER FLUX</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setTorchActive(!torchActive)}
          style={[styles.torchButton, torchActive && styles.torchButtonActive]}
        >
          <Ionicons
            name={torchActive ? "flashlight" : "flashlight-outline"}
            size={20}
            color={torchActive ? stitchColors.primary : stitchColors.textMuted}
          />
        </Pressable>
        <Pressable
          onPress={resetScannerForm}
          style={styles.resetButton}
          hitSlop={8}
          accessibilityLabel="Réinitialiser le scanner"
        >
          <Ionicons name="refresh-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top HUD Camera Viewfinder */}
          <View style={styles.viewfinderCard}>
            <View style={styles.viewfinderBackground}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torchActive}
                  onBarcodeScanned={
                    scannedCode ? undefined : handleBarcodeScanned
                  }
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "qr",
                      "ean13",
                      "ean8",
                      "code128",
                      "datamatrix",
                    ],
                  }}
                />
              ) : (
                <View style={styles.cameraPermissionPanel}>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={stitchColors.primary}
                  />
                  <Text style={styles.cameraPermissionText}>
                    {permission?.canAskAgain === false
                      ? "L’accès caméra est bloqué dans les réglages du téléphone."
                      : "Autorisez la caméra pour scanner un code."}
                  </Text>
                  <Pressable
                    style={styles.permissionButton}
                    onPress={() =>
                      permission?.canAskAgain === false
                        ? Linking.openSettings()
                        : requestPermission()
                    }
                  >
                    <Text style={styles.permissionButtonText}>
                      {permission?.canAskAgain === false
                        ? "Ouvrir les réglages"
                        : "Autoriser la caméra"}
                    </Text>
                  </Pressable>
                </View>
              )}
              <View pointerEvents="none" style={styles.cameraOverlay} />
              {/* Scan Reticle / Corners Calipers */}
              <View style={styles.reticleContainer}>
                {/* 4 Corners */}
                <View style={[styles.caliper, styles.caliperTopLeft]} />
                <View style={[styles.caliper, styles.caliperTopRight]} />
                <View style={[styles.caliper, styles.caliperBottomLeft]} />
                <View style={[styles.caliper, styles.caliperBottomRight]} />

                {/* Sweeping Laser Line */}
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />

                <Ionicons
                  name="scan"
                  size={36}
                  color="rgba(6,182,212,0.3)"
                  style={styles.centerFocus}
                />
              </View>

              <Text style={styles.reticleInstruction}>
                {permission?.granted
                  ? "ALIGNEZ LE CODE 1D/2D OU DATAMATRIX"
                  : "CAMÉRA EN ATTENTE D’AUTORISATION"}
              </Text>
            </View>

            {/* Detected Code Floating Card (Direct Link to Product Detail) */}
            <Pressable
              style={[
                styles.detectedCodePill,
                scannedProduct && styles.readOnlyPanel,
              ]}
              onPress={() =>
                scannedProduct &&
                router.push(
                  `/(protected)/inventory/${scannedProduct.id}` as any,
                )
              }
            >
              <View style={styles.detectedIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={stitchColors.primary}
                />
              </View>
              <View style={styles.detectedInfo}>
                <Text style={styles.detectedTag}>
                  {scannedProduct ? "PRODUIT DÉTECTÉ" : "EN ATTENTE D’UN CODE"}
                </Text>
                <Text style={styles.detectedTitle} numberOfLines={1}>
                  {scannedProduct?.name ||
                    scannedCode ||
                    "Scannez un code produit"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={stitchColors.primary}
              />
            </Pressable>
          </View>

          {/* Sector Selector */}
          <View style={styles.sectorSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                SECTEUR D&apos;AFFECTATION
              </Text>
              <Text style={styles.protocolBadge}>Protocole ISO-13485</Text>
            </View>

            <View style={styles.sectorButtonsRow}>
              <Pressable
                style={[
                  styles.sectorButton,
                  selectedSector === "pharma" && styles.sectorButtonActive,
                  scannedProduct && styles.readOnlyControl,
                ]}
                onPress={() => setSelectedSector("pharma")}
                disabled={Boolean(scannedProduct)}
              >
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={22}
                  color={
                    selectedSector === "pharma"
                      ? stitchColors.primary
                      : stitchColors.textMuted
                  }
                />
                <View style={styles.sectorButtonTextCol}>
                  <Text style={styles.sectorButtonTitle}>Médical & Pharma</Text>
                  <Text style={styles.sectorButtonDesc}>
                    Chaîne du froid active
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.sectorButton,
                  selectedSector === "it" && styles.sectorButtonActive,
                  scannedProduct && styles.readOnlyControl,
                ]}
                onPress={() => setSelectedSector("it")}
                disabled={Boolean(scannedProduct)}
              >
                <MaterialCommunityIcons
                  name="laptop"
                  size={22}
                  color={
                    selectedSector === "it"
                      ? stitchColors.secondary
                      : stitchColors.textMuted
                  }
                />
                <View style={styles.sectorButtonTextCol}>
                  <Text style={styles.sectorButtonTitle}>
                    Matériel IT & Data
                  </Text>
                  <Text style={styles.sectorButtonDesc}>
                    Actifs serveurs / Baies
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Stock Movement Form Card */}
          <View style={styles.formCard}>
            {/* Quantity Stepper */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>QUANTITÉ DÉPLACÉE</Text>
                <Text
                  style={[
                    styles.stockAvailableText,
                    scannedProduct && styles.readOnlyText,
                  ]}
                >
                  Stock Dispo : {scannedProduct?.quantity ?? "--"} unités
                </Text>
              </View>

              <View style={styles.stepperContainer}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuantity(-1)}
                >
                  <Ionicons name="remove" size={24} color={stitchColors.text} />
                </Pressable>

                <View style={styles.stepperValueContainer}>
                  <View style={styles.stepperValueRow}>
                    <Text style={styles.stepperValueText}>{quantity}</Text>
                    <Text style={styles.stepperUnitText}>unités</Text>
                  </View>
                  <Text style={styles.stepperSubtext}>
                    ≈ {Math.ceil(quantity / 5)} boîtes de 5u
                  </Text>
                </View>

                <Pressable
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuantity(1)}
                >
                  <Ionicons name="add" size={24} color={stitchColors.text} />
                </Pressable>
              </View>

              {/* Quick Step Buttons */}
              <View style={styles.quickStepsRow}>
                {[1, 5, 10, 25].map((step) => (
                  <Pressable
                    key={step}
                    style={styles.quickStepBadge}
                    onPress={() => handleSetDirectQuantity(step)}
                  >
                    <Text style={styles.quickStepText}>+{step}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Movement Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>MOTIF DU TRANSFERT</Text>
              <View
                style={[
                  styles.pickerBox,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 10 }}
                />
                <Picker
                  selectedValue={reason}
                  onValueChange={(value) => setReason(value)}
                  style={[styles.reasonPicker, { color: colors.text, height: 100 }]}
                  dropdownIconColor={colors.textMuted}
                >
                  <Picker.Item label="Choisir un motif" value="" />
                  <Picker.Item
                    label="Transfert entre sites"
                    value="Transfert entre sites"
                  />
                  <Picker.Item
                    label="Mise à disposition"
                    value="Mise à disposition"
                  />
                  <Picker.Item label="Autre" value="Autre" />
                </Picker>
              </View>
            </View>

            {/* Operator Metadata */}
            <View style={styles.operatorTile}>
              <View style={styles.operatorLeft}>
                <View style={styles.operatorIcon}>
                  <Ionicons
                    name="person"
                    size={18}
                    color={stitchColors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.operatorRole}>AGENT RESPONSABLE</Text>
                  <Text style={styles.operatorName}>
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : user?.name || user?.email || "Session non identifiée"}
                  </Text>
                </View>
              </View>
              <View style={styles.sessionBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={stitchColors.tertiary}
                />
                <Text style={styles.validatedText}>SESSION ACTIVE</Text>
              </View>
            </View>

            {/* Operator Note */}
            <View style={styles.noteInputContainer}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={stitchColors.textMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.noteInput}
                placeholder="Ajouter une consigne ou n° de chariot..."
                placeholderTextColor="#64748B"
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Confirmation Action Button */}
          <Pressable
            style={[styles.confirmButton, submitting && { opacity: 0.7 }]}
            onPress={handleConfirmMovement}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0B0F17" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#0B0F17" />
                <Text style={styles.confirmButtonText}>
                  Confirmer le Mouvement
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.syncFooterNotice}>
            Mouvement enregistré dans la base via FastAPI
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-done" size={22} color="#0B0F17" />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: stitchColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(6,182,212,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 14,
    color: stitchColors.primary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontFamily: "System",
    fontSize: 10,
    color: stitchColors.textMuted,
    letterSpacing: 1.5,
  },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  torchButtonActive: {
    borderColor: stitchColors.primary,
    borderWidth: 1,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  viewfinderCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: stitchColors.bgDark,
    borderWidth: 1,
    borderColor: stitchColors.border,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  viewfinderBackground: {
    height: 200,
    backgroundColor: "#080C14",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8,12,20,0.2)",
  },
  cameraPermissionPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  cameraPermissionText: {
    color: stitchColors.text,
    fontSize: 13,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: stitchColors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  permissionButtonText: {
    color: stitchColors.bgDark,
    fontSize: 12,
    fontWeight: "700",
  },
  reticleContainer: {
    width: 220,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  caliper: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: stitchColors.primary,
  },
  caliperTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  caliperTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  caliperBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  caliperBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  laserLine: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: stitchColors.primary,
    shadowColor: stitchColors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  centerFocus: {
    opacity: 0.6,
  },
  reticleInstruction: {
    color: stitchColors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 8,
    fontFamily: "System",
  },
  detectedCodePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.cardElevated,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: stitchColors.border,
  },
  readOnlyPanel: {
    backgroundColor: stitchColors.surface,
    opacity: 0.72,
  },
  detectedIconContainer: {
    marginRight: 10,
  },
  detectedInfo: {
    flex: 1,
  },
  detectedTag: {
    fontSize: 10,
    color: stitchColors.tertiary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detectedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
    marginTop: 2,
  },
  sectorSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    color: stitchColors.textMuted,
    letterSpacing: 1,
    fontWeight: "700",
  },
  protocolBadge: {
    fontSize: 11,
    color: stitchColors.primary,
    fontWeight: "700",
  },
  sectorButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  sectorButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: stitchColors.card,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 10,
  },
  sectorButtonActive: {
    borderColor: stitchColors.primary,
    backgroundColor: stitchColors.cardElevated,
  },
  readOnlyControl: {
    borderColor: stitchColors.border,
    backgroundColor: stitchColors.surface,
    opacity: 0.62,
  },
  sectorButtonTextCol: {
    flex: 1,
  },
  sectorButtonTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  sectorButtonDesc: {
    fontSize: 10,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: stitchColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.textMuted,
    letterSpacing: 1,
  },
  stockAvailableText: {
    fontSize: 11,
    color: stitchColors.tertiary,
    fontWeight: "600",
  },
  readOnlyText: {
    color: stitchColors.textMuted,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.bgDark,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  stepperValueText: {
    fontSize: 24,
    fontWeight: "900",
    color: stitchColors.primary,
  },
  stepperUnitText: {
    fontSize: 12,
    color: stitchColors.textMuted,
    fontWeight: "600",
  },
  stepperSubtext: {
    fontSize: 10,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  quickStepsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  quickStepBadge: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  quickStepText: {
    fontSize: 12,
    fontWeight: "700",
    color: stitchColors.text,
  },
  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.bgDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  pickerText: {
    fontSize: 12,
    color: stitchColors.text,
    fontWeight: "600",
    flex: 1,
  },
  reasonPicker: {
    flex: 1,
    height: 46,
    marginLeft: -8,
  },
  operatorTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: stitchColors.cardElevated,
    padding: 10,
    borderRadius: 10,
  },
  operatorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  operatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(6,182,212,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  operatorRole: {
    fontSize: 9,
    color: stitchColors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  operatorName: {
    fontSize: 12,
    color: stitchColors.text,
    fontWeight: "700",
  },
  validatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  validatedText: {
    fontSize: 11,
    color: stitchColors.tertiary,
    fontWeight: "800",
  },
  noteInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.bgDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  noteInput: {
    flex: 1,
    fontSize: 12,
    color: stitchColors.text,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 12,
    backgroundColor: stitchColors.primary,
    gap: 10,
    shadowColor: stitchColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B0F17",
  },
  syncFooterNotice: {
    fontSize: 10,
    color: stitchColors.textMuted,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  toastContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: stitchColors.tertiary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: "#0B0F17",
    fontWeight: "800",
    fontSize: 13,
    flex: 1,
  },
});
