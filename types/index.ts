export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category_id: number;
  created_at?: string;
  category?: Category;
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
