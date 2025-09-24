import api from "../lib/api";
import { DatabaseConnection } from "../types";
export async function connectDB(config: DatabaseConnection) {
  const response = await api.post("/connectDB", config);
  return response;
}
