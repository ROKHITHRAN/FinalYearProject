export interface ChatMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  dbUrl: string;
  username: string;
  alias: string;
  history: ChatMessage[];
  isConnected: boolean;
  createdAt: Date;
}

export interface DatabaseConnection {
  dbUrl: string;
  username: string;
  password: string;
  alias?: string;
}

export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}