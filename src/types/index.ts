export interface ChatMessage {
  id: string;
  sender: "user" | "system";
  timestamp: Date;
  text?: string;
}

export interface Session {
  id: string;
  dbType: string;
  host: string;
  port: number;
  dbName: string;
  username: string;
  password?: string;
  alias: string;
  isConnected: boolean;
  createdAt: Date;
  summary: string;
}

export interface DatabaseConnection {
  type: "mysql" | "postgresql" | "sqlite" | "mongodb";
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  alias?: string;
}

export type Theme = "light" | "dark";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}
