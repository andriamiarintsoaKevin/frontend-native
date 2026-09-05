import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitchColors, useTheme } from "@/components/themeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryService } from "@/services/inventory";
import { movementService } from "@/services/movements";
import { DashboardMetrics, Product, SectorType, StockMovement } from "@/types";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const [activeSector, setActiveSector] = useState<SectorType>("medical");
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [productsData, statsData, movementsData] = await Promise.allSettled(
        [
          inventoryService.getProducts({ sector: activeSector }),
          inventoryService.getDashboardStats(),
          movementService.getMovements(),
        ],
      );

      if (productsData.status === "fulfilled") {
        setProducts(productsData.value);
      }
      if (statsData.status === "fulfilled") {
        setMetrics(statsData.value);
      }
      if (movementsData.status === "fulfilled") {
        setMovements(movementsData.value.slice(0, 3));
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSector]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: stitchColors.bgDark }]}
    >
      {/* 1. Header (Sticky App Bar) */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons
              name="cube-outline"
              size={18}
              color={stitchColors.primary}
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>OMNISTOCK</Text>
            <Text style={styles.brandSubtitle}>TABLEAU DE BORD</Text>
          </View>
        </View>

        <View style={styles.appBarActions}>
          <Pressable
            onPress={handleLogout}
            style={styles.actionIconBtn}
            hitSlop={8}
            accessibilityLabel="Se déconnecter"
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={stitchColors.textMuted}
            />
          </Pressable>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {typeof user?.name === "string" && user.name.length > 0
                  ? user.name.charAt(0).toUpperCase()
                  : "D"}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={stitchColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Sector Filter Header (Segmented Pills) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorPillsContainer}
        >
          <Pressable
            style={[
              styles.sectorPill,
              activeSector === "medical" && styles.sectorPillActiveMedical,
            ]}
            onPress={() => setActiveSector("medical")}
          >
            <View
              style={[
                styles.sectorPulseDot,
                {
                  backgroundColor:
                    activeSector === "medical"
                      ? stitchColors.primary
                      : stitchColors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.sectorPillText,
                activeSector === "medical" && styles.sectorPillTextActive,
              ]}
            >
              Médical / Pharma
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.sectorPill,
              activeSector === "it" && styles.sectorPillActiveIT,
            ]}
            onPress={() => setActiveSector("it")}
          >
            <View
              style={[
                styles.sectorPulseDot,
                {
                  backgroundColor:
                    activeSector === "it"
                      ? stitchColors.secondary
                      : stitchColors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.sectorPillText,
                activeSector === "it" && {
                  color: stitchColors.secondary,
                  fontWeight: "700",
                },
              ]}
            >
              Matériel IT
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.sectorPill,
              activeSector === "general" && styles.sectorPillActiveGeneral,
            ]}
            onPress={() => setActiveSector("general")}
          >
            <View
              style={[
                styles.sectorPulseDot,
                {
                  backgroundColor:
                    activeSector === "general"
                      ? stitchColors.tertiary
                      : stitchColors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.sectorPillText,
                activeSector === "general" && {
                  color: stitchColors.tertiary,
                  fontWeight: "700",
                },
              ]}
            >
              Général / Logistique
            </Text>
          </Pressable>
        </ScrollView>

        {/* 3. Operational Status Banner (Cold-chain summary) */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBannerStripe} />
          <View style={styles.statusBannerLeft}>
            <View style={styles.statusIconBox}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={22}
                color={stitchColors.primary}
              />
            </View>
            <View>
              <View style={styles.hubTitleRow}>
                <Text style={styles.hubTitleText}>
                  {metrics?.cold_chain.hub || "Site non renseigné"}
                </Text>
                <View style={styles.liveSyncBadge}>
                  <Text style={styles.liveSyncText}>BASE DE DONNÉES</Text>
                </View>
              </View>
              <Text style={styles.hubSubtitleText}>
                {metrics?.cold_chain.current_temp === null
                  ? "Température non renseignée"
                  : "Température issue de la base"}
              </Text>
            </View>
          </View>

          <View style={styles.statusBannerRight}>
            <Text style={styles.tempValueText}>
              {metrics?.cold_chain.current_temp !== null &&
              metrics?.cold_chain.current_temp !== undefined
                ? `+${metrics.cold_chain.current_temp}°C`
                : "--"}
            </Text>
            <Text style={styles.tempStatusText}>
              {metrics ? metrics.cold_chain.status : "Données indisponibles"}
            </Text>
          </View>
        </View>

        {/* 4. Key Metrics 2x2 Grid */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Units */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: "rgba(6,182,212,0.12)" },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={stitchColors.primary}
                />
              </View>
              <View style={styles.trendPill}>
                <Ionicons
                  name="trending-up"
                  size={12}
                  color={stitchColors.tertiary}
                />
                <Text style={styles.trendText}>Base de référence</Text>
              </View>
            </View>
            <View style={styles.metricBody}>
              <Text style={styles.metricMainValue}>
                {metrics?.total_units ?? "--"}
              </Text>
              <Text style={styles.metricLabel}>UNITÉS TOTALES</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterLabel}>Actifs</Text>
              <Text style={styles.metricFooterValue}>
                {metrics ? `${metrics.active_references} réf` : "--"}
              </Text>
            </View>
          </View>

          {/* Card 2: Critical Stock */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: "rgba(239,68,68,0.15)" },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={stitchColors.error}
                />
              </View>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: "rgba(239,68,68,0.2)" },
                ]}
              >
                <Text
                  style={[styles.badgePillText, { color: stitchColors.error }]}
                >
                  REQUIS
                </Text>
              </View>
            </View>
            <View style={styles.metricBody}>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
              >
                <Text
                  style={[
                    styles.metricMainValue,
                    { color: stitchColors.error },
                  ]}
                >
                  {metrics?.critical_stock_count ?? "--"}
                </Text>
                <Text
                  style={[styles.metricUnit, { color: stitchColors.error }]}
                >
                  réf
                </Text>
              </View>
              <Text style={styles.metricLabel}>STOCK CRITIQUE</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterLabel}>Sous le seuil</Text>
              <Text
                style={[
                  styles.metricFooterValue,
                  { color: stitchColors.error },
                ]}
              >
                {metrics ? "Seuil configuré" : "--"}
              </Text>
            </View>
          </View>

          {/* Card 3: Expiring Soon */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: "rgba(139,92,246,0.15)" },
                ]}
              >
                <Ionicons
                  name="alarm-outline"
                  size={18}
                  color={stitchColors.secondary}
                />
              </View>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: "rgba(139,92,246,0.2)" },
                ]}
              >
                <Text
                  style={[
                    styles.badgePillText,
                    { color: stitchColors.secondary },
                  ]}
                >
                  SENSIBLE
                </Text>
              </View>
            </View>
            <View style={styles.metricBody}>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
              >
                <Text
                  style={[
                    styles.metricMainValue,
                    { color: stitchColors.secondary },
                  ]}
                >
                  {metrics?.expiring_soon_count ?? "--"}
                </Text>
                <Text
                  style={[styles.metricUnit, { color: stitchColors.secondary }]}
                >
                  lots
                </Text>
              </View>
              <Text style={styles.metricLabel}>PÉRIMANT &lt; 30J</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterLabel}>Prochain lot</Text>
              <Text
                style={[
                  styles.metricFooterValue,
                  { color: stitchColors.error },
                ]}
              >
                {metrics ? "Voir les produits" : "--"}
              </Text>
            </View>
          </View>

          {/* Card 4: Turnover Rate */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: "rgba(16,185,129,0.15)" },
                ]}
              >
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color={stitchColors.tertiary}
                />
              </View>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: "rgba(16,185,129,0.2)" },
                ]}
              >
                <Text
                  style={[
                    styles.badgePillText,
                    { color: stitchColors.tertiary },
                  ]}
                >
                  {metrics?.turnover_rate === null
                    ? "NON DISPONIBLE"
                    : "CALCULÉ"}
                </Text>
              </View>
            </View>
            <View style={styles.metricBody}>
              <Text
                style={[
                  styles.metricMainValue,
                  { color: stitchColors.tertiary },
                ]}
              >
                {metrics?.turnover_rate !== null &&
                metrics?.turnover_rate !== undefined
                  ? `${metrics.turnover_rate}%`
                  : "--"}
              </Text>
              <Text style={styles.metricLabel}>TAUX ROTATION</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterLabel}>Cycle moyen</Text>
              <Text style={styles.metricFooterValue}>
                Donnée non disponible
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Warehouse Quick Action Triggers */}
        <View style={styles.quickActionsSection}>
          {/* Highlight Card linking to Fiche Produit */}
          {products[0] && (
            <Pressable
              style={styles.highlightProductCard}
              onPress={() =>
                router.push(`/(protected)/inventory/${products[0].id}` as any)
              }
            >
              <View style={styles.highlightProductStripe} />
              <View style={styles.highlightProductLeft}>
                <View style={styles.highlightIcon}>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={18}
                    color={stitchColors.error}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.highlightNameRow}>
                    <Text style={styles.highlightNameText}>
                      {products[0].name}
                    </Text>
                    <Text style={styles.highlightLocationBadge}>
                      {products[0].sku || "Produit"}
                    </Text>
                  </View>
                  <Text style={styles.highlightOperatorText}>
                    {products[0].warehouse_location ||
                      "Emplacement non renseigné"}
                  </Text>
                </View>
              </View>
              <View style={styles.highlightProductRight}>
                <Text style={styles.highlightQtyDelta}>
                  {products[0].quantity} U
                </Text>
                <Text style={styles.highlightTimeText}>Stock</Text>
              </View>
            </Pressable>
          )}

          {/* Quick Action 3-Col Buttons */}
          <View style={styles.quickButtonsGrid}>
            <Pressable
              style={styles.heroScanButton}
              onPress={() => router.push("/(protected)/scanner" as any)}
            >
              <View style={styles.heroScanIcon}>
                <Ionicons name="scan-outline" size={24} color="#0B0F17" />
              </View>
              <Text style={styles.heroScanText}>Scanner Code</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() =>
                router.push(
                  "/(protected)/movements/create?movementType=IN" as any,
                )
              }
            >
              <View style={styles.secondaryActionIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={stitchColors.tertiary}
                />
              </View>
              <Text style={styles.secondaryActionText}>Entrée Stock</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() =>
                router.push(
                  "/(protected)/movements/create?movementType=OUT" as any,
                )
              }
            >
              <View style={styles.secondaryActionIcon}>
                <Ionicons
                  name="swap-horizontal"
                  size={22}
                  color={stitchColors.secondary}
                />
              </View>
              <Text style={styles.secondaryActionText}>Sortie Stock</Text>
            </Pressable>
          </View>
        </View>

        {/* 7. Recent Activity Stream */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.activityHeading}>
              FLUX D&apos;ACTIVITÉ RÉCENT
            </Text>
            <Pressable
              onPress={() =>
                router.push("/(protected)/movements/history" as any)
              }
            >
              <Text style={styles.seeAllText}>Voir l&apos;historique</Text>
            </Pressable>
          </View>

          {movements.length === 0 ? (
            <Text style={styles.activityItemSub}>
              Aucun mouvement enregistré.
            </Text>
          ) : (
            movements.map((movement) => {
              const isEntry = movement.movement_type === "IN";
              const accent = isEntry
                ? stitchColors.tertiary
                : stitchColors.error;
              return (
                <Pressable
                  key={movement.id}
                  style={styles.activityItemCard}
                  onPress={() =>
                    router.push(
                      `/(protected)/inventory/${movement.product_id}` as any,
                    )
                  }
                >
                  <View
                    style={[styles.activityStripe, { backgroundColor: accent }]}
                  />
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIconBox,
                        {
                          backgroundColor: isEntry
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isEntry
                            ? "arrow-down-outline"
                            : "arrow-forward-outline"
                        }
                        size={16}
                        color={accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityItemTitle} numberOfLines={1}>
                        {productNames.get(movement.product_id) ||
                          `Produit #${movement.product_id}`}
                      </Text>
                      <Text style={styles.activityItemSub} numberOfLines={1}>
                        {movement.reason || "Sans motif"} ·{" "}
                        {new Date(movement.created_at).toLocaleString("fr-FR")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activityDelta, { color: accent }]}>
                    {isEntry ? "+" : "-"}
                    {movement.quantity} U
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(6,182,212,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: stitchColors.primary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
    letterSpacing: 1.5,
  },
  appBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: stitchColors.borderLight,
  },
  avatarInitial: {
    color: stitchColors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: stitchColors.tertiary,
    borderWidth: 1.5,
    borderColor: stitchColors.bgDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  sectorPillsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  sectorPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: stitchColors.card,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 6,
  },
  sectorPillActiveMedical: {
    backgroundColor: "rgba(6,182,212,0.15)",
    borderColor: stitchColors.primary,
  },
  sectorPillActiveIT: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: stitchColors.secondary,
  },
  sectorPillActiveGeneral: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: stitchColors.tertiary,
  },
  sectorPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectorPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: stitchColors.textMuted,
  },
  sectorPillTextActive: {
    color: stitchColors.primary,
    fontWeight: "800",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: stitchColors.border,
    position: "relative",
    overflow: "hidden",
  },
  statusBannerStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: stitchColors.primary,
  },
  statusBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: stitchColors.bgDark,
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hubTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  liveSyncBadge: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveSyncText: {
    fontSize: 9,
    fontWeight: "800",
    color: stitchColors.tertiary,
    letterSpacing: 0.5,
  },
  hubSubtitleText: {
    fontSize: 11,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  statusBannerRight: {
    alignItems: "flex-end",
  },
  tempValueText: {
    fontSize: 14,
    fontWeight: "800",
    color: stitchColors.primary,
  },
  tempStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: stitchColors.tertiary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: stitchColors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
    justifyContent: "space-between",
    minHeight: 125,
  },
  metricCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.tertiary,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  metricBody: {
    marginTop: 8,
  },
  metricMainValue: {
    fontSize: 22,
    fontWeight: "900",
    color: stitchColors.text,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: stitchColors.border,
    paddingTop: 6,
    marginTop: 6,
  },
  metricFooterLabel: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  metricFooterValue: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.text,
  },
  quickActionsSection: {
    gap: 10,
  },
  highlightProductCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: stitchColors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
    position: "relative",
    overflow: "hidden",
  },
  highlightProductStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: stitchColors.tertiary,
  },
  highlightProductLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  highlightNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  highlightLocationBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: stitchColors.textMuted,
    backgroundColor: stitchColors.bgDark,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  highlightOperatorText: {
    fontSize: 11,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  highlightProductRight: {
    alignItems: "flex-end",
  },
  highlightQtyDelta: {
    fontSize: 14,
    fontWeight: "800",
    color: stitchColors.error,
  },
  highlightTimeText: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
  quickButtonsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  heroScanButton: {
    flex: 1.2,
    backgroundColor: stitchColors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: stitchColors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  heroScanIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroScanText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F17",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: stitchColors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  secondaryActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: stitchColors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: stitchColors.text,
  },
  telemetryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  telemetryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: stitchColors.bgDark,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryInfoCol: {
    flex: 1,
  },
  telemetryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  telemetryZoneTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: stitchColors.tertiary,
    letterSpacing: 1,
  },
  telemetryCapacityValue: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
  },
  capacityProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: stitchColors.border,
    marginTop: 6,
    overflow: "hidden",
  },
  capacityProgressBarFill: {
    height: "100%",
    backgroundColor: stitchColors.primary,
    borderRadius: 3,
  },
  telemetrySubtext: {
    fontSize: 10,
    color: stitchColors.textMuted,
    marginTop: 4,
  },
  activitySection: {
    gap: 10,
  },
  activityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  activityHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.textMuted,
    letterSpacing: 1,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.primary,
  },
  activityItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: stitchColors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: stitchColors.border,
    position: "relative",
    overflow: "hidden",
  },
  activityStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: stitchColors.text,
  },
  activityLotPill: {
    fontSize: 9,
    fontWeight: "700",
    color: stitchColors.textMuted,
    backgroundColor: stitchColors.cardElevated,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityItemSub: {
    fontSize: 11,
    color: stitchColors.textMuted,
    marginTop: 2,
  },
  activityRight: {
    alignItems: "flex-end",
  },
  activityDelta: {
    fontSize: 13,
    fontWeight: "800",
  },
  activityTime: {
    fontSize: 10,
    color: stitchColors.textMuted,
  },
});
