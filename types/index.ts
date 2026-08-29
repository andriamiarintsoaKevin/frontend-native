export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  unit_price: number;
  stock_quantity: number;
  category_id: number;
  created_at?: string;
  category?: Category;
}
