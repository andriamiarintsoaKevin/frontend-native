import { StockMovement, StockMovementCreate } from "../types";
import api from "./api";

const movementsPrefix = "/v1/movements";

export const movementService = {
  getMovements: async (productId?: number): Promise<StockMovement[]> => {
    const response = await api.get(`${movementsPrefix}/`, {
      params: productId ? { product_id: productId } : undefined,
    });
    return Array.isArray(response.data)
      ? response.data
      : response.data?.items || response.data?.data || [];
  },

  createMovement: async (
    movement: StockMovementCreate,
  ): Promise<StockMovement> => {
    const response = await api.post(`${movementsPrefix}/`, movement);
    return response.data;
  },
};
