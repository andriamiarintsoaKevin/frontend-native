import { Category, Product } from "../types";
import api from "./api";

const productsPrefix = "/v1/products";
const categoriesPrefix = "/v1/categories";

export const inventoryService = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get(`${productsPrefix}/`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || response.data?.data || [];
  },
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`${productsPrefix}/${id}`);
    return response.data;
  },
  createProduct: async (
    product: Omit<Product, "id" | "category" | "created_at">,
  ): Promise<Product> => {
    const response = await api.post(`${productsPrefix}/`, product);
    return response.data;
  },
  updateProduct: async (
    id: number,
    product: Partial<Product>,
  ): Promise<Product> => {
    const response = await api.put(`${productsPrefix}/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`${productsPrefix}/${id}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get(`${categoriesPrefix}/`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || response.data?.data || [];
  },
  createCategory: async (category: Omit<Category, "id">): Promise<Category> => {
    const response = await api.post(`${categoriesPrefix}/`, category);
    return response.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`${categoriesPrefix}/${id}`);
  },
};
