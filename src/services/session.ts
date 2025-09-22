import { collection, getDocs } from "firebase/firestore/lite";
import { AuthUser, db } from "./firebase";
import { Session } from "../types";

const user: AuthUser = JSON.parse(localStorage.getItem("dbChatUser") || "null");
export const getUserSessions = async (): Promise<Session[]> => {
  try {
    // Reference to the sessions subcollection
    const sessionsRef = collection(db, "users", user.uid, "sessions");

    // Fetch all documents in sessions
    const snapshot = await getDocs(sessionsRef);

    // Map documents to Session objects
    const sessions: Session[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        dbUrl: data.dbUrl,
        username: data.username,
        alias: data.alias,
        history: data.history || [],
        isConnected: data.isConnected,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate() // ✅ Firestore Timestamp → Date
          : new Date(),
      };
    });

    return sessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};
