import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { type signInBody, authApi } from "../api/auth-api";

export const AUTHENTICATION_STORAGE_KEY = "app-auth-session";

export interface User {
  _id: string;
  username: string;
  role: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginResult {
  user: User;
  success: boolean;
  message: string;
}

interface AuthenticationContextValue {
  authenticatedUser: User | null;
  isAuthenticated: boolean;
  login: (credentials: signInBody) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearPersistence: () => void;
}

const AuthenticationContext = createContext<AuthenticationContextValue | undefined>(undefined);

const getPersistedUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(AUTHENTICATION_STORAGE_KEY);
  return data ? (JSON.parse(data) as User) : null;
};

const persistUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(AUTHENTICATION_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTHENTICATION_STORAGE_KEY);
  }
};

export function AuthenticationProvider({ children }: { children: ReactNode }) {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(getPersistedUser);

  const login = async (credentials: signInBody): Promise<LoginResult> => {
    const response = await authApi.signIn(credentials);

    const { data: payload, success, message } = response.data;
    const { user } = payload;

    persistUser(user);
    setAuthenticatedUser(user);

    return {
      user,
      success,
      message,
    };
  };

  const logout = async (): Promise<void> => {
    try {
      // await authApi.revokeToken();
    } finally {
      clearPersistence();
    }
  };

  const clearPersistence = (): void => {
    persistUser(null);
    setAuthenticatedUser(null);
  };

  const value = useMemo(
    (): AuthenticationContextValue => ({
      authenticatedUser,
      isAuthenticated: Boolean(authenticatedUser),
      login,
      logout,
      clearPersistence,
    }),
    [authenticatedUser],
  );

  return <AuthenticationContext.Provider value={value}>{children}</AuthenticationContext.Provider>;
}

export function useAuthentication(): AuthenticationContextValue {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "USE_AUTHENTICATION_OUTSIDE_BOUNDARIES: Must be used within AuthenticationProvider",
    );
  }
  return context;
}
