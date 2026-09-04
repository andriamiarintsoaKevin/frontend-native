export interface Category {
  id: number;
  name: string;
}

export type SectorType = "general" | "medical" | "it";

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category_id: number;
  created_at?: string;
  category?: Category;

  // Spécificités sectorielles et logistiques
  sku?: string | null;
  sector?: SectorType;
  reorder_threshold?: number;
  warehouse_location?: string | null;

  // Médical / Pharma
  batch_number?: string | null;
  expiry_date?: string | null;
  storage_temperature?: number | null;
  is_expired?: boolean;

  // IT & Matériel
  serial_number?: string | null;
  hardware_condition?: string | null;
  assigned_to?: string | null;
}

export interface DashboardMetrics {
  total_units: number;
  active_references: number;
  critical_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  turnover_rate: number;
  cold_chain: {
    status: string;
    current_temp: number;
    target_range: string;
    hub: string;
  };
}

export type MovementType = "IN" | "OUT";

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string | null;
  created_at: string;
}

export interface StockMovementCreate {
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string | null;
}

