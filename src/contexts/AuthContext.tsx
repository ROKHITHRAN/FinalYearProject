// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  register,
  loginWithGoogle,
  logout,
  loginWithEmail,
  saveUser,
} from "../services/firebase";

interface User {
  uid: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: sessionStorage.getItem("token") || null,
  });
  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = sessionStorage.getItem("dbChatUser");
    const token = sessionStorage.getItem("token");
    if (savedUser && token) {
      try {
        setAuthState({
          user: JSON.parse(savedUser),
          isAuthenticated: true,
          isLoading: false,
          token,
        });
      } catch {
        sessionStorage.removeItem("dbChatUser");
        sessionStorage.removeItem("token");
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await loginWithEmail(email, password); // firebase.js login returns { uid, email, token }
      sessionStorage.setItem("dbChatUser", JSON.stringify(user));
      sessionStorage.setItem("token", user.token!);
      const FBuser: User = {
        uid: user.uid,
        email: user.email || "",
        name: user.name || undefined,
      };
      setAuthState({
        user: FBuser,
        isAuthenticated: true,
        isLoading: false,
        token: user.token!,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await register(email, password); // firebase.js register
      localStorage.setItem("dbChatUser", JSON.stringify(user));
      localStorage.setItem("token", user.token!);
      const FBuser: User = {
        uid: user.uid,
        email: user.email || "",
        name: user.name || undefined,
      };
      setAuthState({
        user: FBuser,
        isAuthenticated: true,
        isLoading: false,
        token: user.token!,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signInWithGoogleHandler = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await loginWithGoogle(); // firebase.js Google login
      sessionStorage.setItem("dbChatUser", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));

      sessionStorage.setItem("token", user.token!);
      const FBuser: User = {
        uid: user.uid,
        email: user.email || "",
        name: user.name || undefined,
      };
      setAuthState({
        user: FBuser,
        isAuthenticated: true,
        isLoading: false,
        token: user.token || "",
      });
      await saveUser(FBuser);
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOutHandler = async () => {
    await logout();
    // localStorage.removeItem("dbChatUser");
    sessionStorage.removeItem("dbChatUser");
    sessionStorage.removeItem("token");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signInWithGoogle: signInWithGoogleHandler,
        signOut: signOutHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
