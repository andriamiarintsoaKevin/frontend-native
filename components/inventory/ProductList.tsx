import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { Category, Product } from "../../types";
import { stitchColors, useTheme } from "../themeProvider";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  refreshing: boolean;
}

type FilterType = "all" | "medical" | "low_stock" | "expired" | "it";

export default function ProductList({
  products,
  categories,
  onRefresh,
  refreshing,
}: ProductListProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(q)) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeFilter === "medical") {
      return (p.sector || "general") === "medical";
    }
    if (activeFilter === "it") {
      return p.sector === "it";
    }
    if (activeFilter === "low_stock") {
      return p.quantity <= (p.reorder_threshold ?? 10);
    }
    if (activeFilter === "expired") {
      return p.is_expired === true;
    }
    return true;
  });

  const renderProduct = ({ item }: { item: Product }) => {
    const isMedical = (item.sector || "general") === "medical";
    const isIT = item.sector === "it";
    const isLowStock = item.quantity <= (item.reorder_threshold ?? 10);

    const notchColor = isMedical
      ? stitchColors.tertiary
      : isIT
        ? stitchColors.secondary
        : stitchColors.primary;

    return (
      <Pressable
        style={styles.cardContainer}
        onPress={() => router.push(`/(protected)/inventory/${item.id}` as any)}
      >
        {/* Sector Notch Line */}
        <View style={[styles.cardNotch, { backgroundColor: notchColor }]} />

        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isMedical
                    ? "rgba(16,185,129,0.12)"
                    : isIT
                      ? "rgba(139,92,246,0.12)"
                      : "rgba(6,182,212,0.12)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isMedical ? "pill" : isIT ? "laptop" : "package-variant"}
                size={22}
                color={notchColor}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.refBadgeRow}>
                <Text style={styles.refBadgeText}>
                  {item.batch_number
                    ? `Lot #${item.batch_number}`
                    : item.serial_number
                      ? `S/N: ${item.serial_number}`
                      : `SKU: ${item.sku || "REF-" + item.id}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          {item.is_expired ? (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: "rgba(239,68,68,0.15)" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: stitchColors.error },
                ]}
              />
              <Text
                style={[styles.statusPillText, { color: stitchColors.error }]}
              >
                Périmé
              </Text>
            </View>
          ) : isLowStock ? (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: "rgba(245,158,11,0.15)" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: stitchColors.warning },
                ]}
              />
              <Text
                style={[styles.statusPillText, { color: stitchColors.warning }]}
              >
                Stock Faible
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: "rgba(16,185,129,0.12)" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: stitchColors.tertiary },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: stitchColors.tertiary },
                ]}
              >
                En Stock
              </Text>
            </View>
          )}
        </View>

        {/* Telemetry Row */}
        <View style={styles.telemetryBox}>
          <View style={styles.telemetryColLeft}>
            <Ionicons
              name="location-outline"
              size={14}
              color={stitchColors.tertiary}
            />
            <Text style={styles.telemetryText} numberOfLines={1}>
              {item.warehouse_location || "Emplacement non renseigné"}
            </Text>
          </View>

          <View style={styles.telemetryColRight}>
            <Ionicons
              name={isMedical ? "thermometer-outline" : "hardware-chip-outline"}
              size={14}
              color={stitchColors.primary}
            />
            <Text
              style={[styles.telemetryText, { color: stitchColors.primary }]}
              numberOfLines={1}
            >
              {isMedical
                ? item.storage_temperature !== null &&
                  item.storage_temperature !== undefined
                  ? `Temp ${item.storage_temperature}°C`
                  : "Température non renseignée"
                : item.hardware_condition || "État non renseigné"}
            </Text>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooterRow}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityNumber}>{item.quantity}</Text>
            <Text style={styles.quantityLabel}>Unités restantes</Text>
          </View>

          <View style={styles.quickActionsRow}>
            <Pressable
              style={styles.logsButton}
              onPress={() =>
                router.push(`/(protected)/inventory/${item.id}` as any)
              }
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={stitchColors.text}
              />
              <Text style={styles.logsButtonText}>Détails</Text>
            </Pressable>

            <Pressable
              style={styles.addStepButton}
              onPress={() => router.push("/(protected)/scanner" as any)}
            >
              <Ionicons name="add" size={18} color="#0B0F17" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Search + Barcode Trigger */}
      <View style={styles.searchBarContainer}>
        <Ionicons
          name="search"
          size={18}
          color={stitchColors.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit, lot, série..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
        <Pressable
          style={styles.barcodeScanBtn}
          onPress={() => router.push("/(protected)/scanner" as any)}
        >
          <Ionicons name="scan" size={18} color={stitchColors.text} />
        </Pressable>
      </View>

      {/* 2. Horizontal Filter Pill Rack */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
          data={[
            { key: "all", label: "Tous" },
            { key: "medical", label: "Médical / Pharma" },
            {
              key: "low_stock",
              label: "Stock Faible",
              colorDot: stitchColors.warning,
            },
            {
              key: "expired",
              label: "Périmés / Urgents",
              colorDot: stitchColors.error,
            },
            { key: "it", label: "Laptops & Serveurs IT" },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item.key;
            return (
              <Pressable
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillSelected,
                ]}
                onPress={() => setActiveFilter(item.key as FilterType)}
              >
                {item.colorDot && (
                  <View
                    style={[
                      styles.filterDot,
                      { backgroundColor: item.colorDot },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.count !== undefined && (
                  <View style={styles.filterCountBadge}>
                    <Text style={styles.filterCountText}>{item.count}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* 3. Items List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="file-tray-outline"
              size={48}
              color={stitchColors.border}
            />
            <Text style={styles.emptyText}>Aucun article trouvé</Text>
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
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stitchColors.cardElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: stitchColors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: stitchColors.text,
  },
  barcodeScanBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: stitchColors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: stitchColors.card,
    borderWidth: 1,
    borderColor: stitchColors.border,
    gap: 6,
  },
  filterPillSelected: {
    backgroundColor: stitchColors.primary,
    borderColor: stitchColors.primary,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: stitchColors.textMuted,
  },
  filterPillTextSelected: {
    color: "#0B0F17",
    fontWeight: "800",
  },
  filterCountBadge: {
    backgroundColor: "rgba(11,15,23,0.3)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0B0F17",
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: stitchColors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: stitchColors.border,
    position: "relative",
    overflow: "hidden",
    gap: 10,
  },
  cardNotch: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: stitchColors.text,
  },
  refBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  refBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: stitchColors.textMuted,
    backgroundColor: stitchColors.cardElevated,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  telemetryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: stitchColors.bgDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  telemetryColLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  telemetryColRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  telemetryText: {
    fontSize: 11,
    color: stitchColors.textMuted,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  quantityNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: stitchColors.text,
  },
  quantityLabel: {
    fontSize: 10,
    color: stitchColors.textMuted,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: stitchColors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: stitchColors.border,
  },
  logsButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: stitchColors.text,
  },
  addStepButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: stitchColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: stitchColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
});
