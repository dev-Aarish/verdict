import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { authApi } from "../api";
import {
  getAuthToken,
  removeAuthToken,
  getCachedUser,
  setCachedUser,
  removeCachedUser,
} from "../api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, bio?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Fast non-blocking local auth bootstrap
    (async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          getAuthToken(),
          getCachedUser(),
        ]);

        if (!isMounted) return;

        if (cachedUser) {
          setUser(cachedUser);
        } else if (!token) {
          setUser(null);
        }

        // Local credentials resolved: mark ready immediately so splash screen can dismiss
        setIsReady(true);

        if (token) {
          // Revalidate session asynchronously in background without blocking UI
          authApi
            .getMe()
            .then(async (currentUser) => {
              if (!isMounted) return;
              if (currentUser) {
                setUser(currentUser);
                await setCachedUser(currentUser);
              }
            })
            .catch(async (err) => {
              if (!isMounted) return;
              const msg = String(err?.message || "").toLowerCase();
              if (
                msg.includes("401") ||
                msg.includes("unauthorized") ||
                msg.includes("invalid token")
              ) {
                setUser(null);
                await removeAuthToken();
                await removeCachedUser();
              }
            });
        } else {
          setUser(null);
          await removeCachedUser();
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setIsReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      await setCachedUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string, bio?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.signup(username, email, password, bio);
      setUser(res.user);
      await setCachedUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setIsLoading(false);
    // Fire backend logout in background so UI is never blocked
    authApi.logout().catch(() => {});
    // Concurrently clear local secure storage and cache
    await Promise.all([
      removeAuthToken(),
      removeCachedUser(),
    ]);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      if (currentUser) {
        setUser(currentUser);
        await setCachedUser(currentUser);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isReady,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
