import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, DatabaseConnection, ChatMessage } from "../types";
import { connectDB } from "../services/connection";
import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore/lite";
import { AuthUser, db } from "../services/firebase";
import { getUserSessions } from "../services/session";
import { useAuth } from "./AuthContext";
import { getQueryResult } from "../services/chat";

interface SessionContextType {
  sessions: Session[];
  currentSessionId: string | null;
  currentSession: Session | null;
  createSession: (
    connection: DatabaseConnection,
    summary: string
  ) => Promise<void>;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string, uid: string) => void;
  renameSession: (sessionId: string, newAlias: string, uid: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  sendQuery: (sessionId: string, query: string) => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

// Mock API functions
const mockConnectDB = async (
  connection: DatabaseConnection,
  summary: string
): Promise<Session> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const session: Session = {
    id: Date.now().toString(),
    dbType: connection.type,
    host: connection.host,
    port: connection.port,
    dbName: connection.database,
    username: connection.username,
    password: connection.password,
    alias: connection.alias || extractDBName(connection.host),
    history: [],
    isConnected: true,
    createdAt: new Date(),
    summary: summary,
  };
  try {
    const user: AuthUser = JSON.parse(
      localStorage.getItem("dbChatUser") || "null"
    );

    const res = await setDoc(
      doc(db, "users", user.uid, "sessions", session.id),
      session
    );
    console.log(res);
  } catch (e) {
    console.log(e);
  }

  return session;
};

const mockQueryDB = async (sessionId: string, query: string): Promise<any> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const response = await getQueryResult(query);
  return response;
  // Mock responses based on query keywords
  if (query.toLowerCase().includes("select")) {
    return `Query executed successfully. Found 15 records matching your criteria.
    
Sample results:
| ID | Name | Department | Salary |
|----|------|------------|---------|
| 1  | John Smith | Engineering | $75,000 |
| 2  | Jane Doe | Marketing | $68,000 |
| 3  | Bob Johnson | Sales | $62,000 |`;
  }

  if (
    query.toLowerCase().includes("create") ||
    query.toLowerCase().includes("insert")
  ) {
    return "Operation completed successfully. 1 row affected.";
  }

  if (query.toLowerCase().includes("update")) {
    return "Update completed successfully. 3 rows affected.";
  }

  if (query.toLowerCase().includes("delete")) {
    return "Delete operation completed. 2 rows affected.";
  }

  return `Query processed: "${query}"\n\nThis is a mock response. The query would be executed against your connected database in a real environment.`;
};

const extractDBName = (dbUrl: string): string => {
  try {
    const parts = dbUrl.split("/");
    const dbName = parts[parts.length - 1];
    return dbName || "Database";
  } catch {
    return "Database";
  }
};

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || null;

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("dbChatSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      // Convert date strings back to Date objects
      const sessions = parsed.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        history: session.history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      getUserSessions().then((res) => {
        setSessions(res);
      });

      setSessions(sessions);
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem("dbChatSessions", JSON.stringify(sessions));
  }, [sessions]);

  const createSession = async (
    connection: DatabaseConnection,
    summary: string
  ) => {
    setIsLoading(true);
    try {
      const newSession = await mockConnectDB(connection, summary);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "system",
        text: `Successfully connected to ${newSession.alias}! You can now start querying your database using natural language.}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === newSession.id
            ? { ...session, history: [welcomeMessage] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = async (sessionId: string, userId: string) => {
    try {
      // 🔹 Delete from Firestore
      await deleteDoc(doc(db, "users", userId, "sessions", sessionId));

      // 🔹 Update local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSessionId === sessionId) {
        setCurrentSessionId((prev) => {
          const remaining = sessions.filter((s) => s.id !== sessionId);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const renameSession = async (
    sessionId: string,
    newAlias: string,
    uid: string
  ) => {
    try {
      // 🔹 Update Firestore
      const sessionRef = doc(db, "users", uid, "sessions", sessionId);
      await updateDoc(sessionRef, { alias: newAlias });

      // 🔹 Update local state
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, alias: newAlias } : session
        )
      );
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  const addMessage = async (sessionId: string, message: ChatMessage) => {
    try {
      const docRef = doc(db, "users", String(user?.uid), "sessions", sessionId);
      await updateDoc(docRef, {
        history: arrayUnion(message),
      });

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, history: [...session.history, message] }
            : session
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const sendQuery = async (sessionId: string, query: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    addMessage(sessionId, userMessage);
    setIsLoading(true);

    try {
      const response = await mockQueryDB(sessionId, query);
      console.log(response);
      const messageText = `Here is the required list: [TABLE_DATA]${JSON.stringify(
        response.data.result
      )}`;
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "system",
        text: messageText,
        timestamp: new Date(),
      };
      addMessage(sessionId, systemMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "system",
        text: "Error executing query. Please check your connection and try again.",
        timestamp: new Date(),
      };
      addMessage(sessionId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        createSession,
        switchSession,
        deleteSession,
        renameSession,
        addMessage,
        sendQuery,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
