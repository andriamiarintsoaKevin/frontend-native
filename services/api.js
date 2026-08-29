import { create } from "axios";
import { storage } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const api = create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur : Ajoute le token Bearer à toutes les requêtes sortantes
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
