import { collection, getDocs } from "firebase/firestore";
import { AuthUser, db } from "./firebase";
import { ChatMessage, Session } from "../types";
import { jwtDecode } from "jwt-decode";

const user: AuthUser = JSON.parse(localStorage.getItem("dbChatUser") || "null");
export const getUserSessions = async (): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, "users", user.uid, "sessions");
    const snapshot = await getDocs(sessionsRef);

    const sessions: Session[] = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        // Fetch history subcollection
        const historyRef = collection(
          db,
          "users",
          user.uid,
          "sessions",
          docSnap.id,
          "history"
        );
        const historySnap = await getDocs(historyRef);

        const history: ChatMessage[] = historySnap.docs.map((h) => ({
          ...h.data(),
          id: h.id,
          timestamp: h.data().createdAt?.toDate?.() ?? new Date(),
        })) as ChatMessage[];

        return {
          id: docSnap.id,
          host: data.host,
          port: data.port,
          dbName: data.dbName,
          username: data.username,
          alias: data.alias,
          history,
          isConnected: data.isConnected,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          summary: data.summary,
        };
      })
    );

    return sessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};

interface DecodedToken {
  exp: number; // expiry in seconds
  iat: number; // issued at
  [key: string]: any;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (err) {
    return true; // invalid token → treat as expired
  }
};
