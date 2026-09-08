import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AuthResult,
  User,
} from "../types";

import {
  clearStoredAuth,
  getStoredUser,
  refreshAuth,
  signIn,
  signOut as authSignOut,
} from "../lib/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  error: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UseAuthResult
  extends AuthState {
  refresh: () => Promise<User | null>;

  signOut: () => Promise<void>;

  logout: () => Promise<void>;

  login: {
    (
      email: string,
      password: string
    ): Promise<AuthResult>;

    (
      credentials: LoginCredentials
    ): Promise<AuthResult>;
  };
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object"
  ) {
    const value = error as {
      message?: unknown;
      error?: unknown;
      detail?: unknown;
    };

    if (
      typeof value.message ===
      "string"
    ) {
      return value.message;
    }

    if (
      typeof value.error ===
      "string"
    ) {
      return value.error;
    }

    if (
      typeof value.detail ===
      "string"
    ) {
      return value.detail;
    }
  }

  return "Unable to complete the authentication request.";
}

export function useAuth(): UseAuthResult {
  const [user, setUser] =
    useState<User | null>(
      getStoredUser()
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadUser =
    useCallback(async () => {
      setLoading(true);

      try {
        const currentUser =
          await refreshAuth();

        setUser(currentUser);

        return currentUser;
      } catch {
        setUser(null);

        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (
      emailOrCredentials:
        | string
        | LoginCredentials,
      password?: string
    ): Promise<AuthResult> => {
      const credentials =
        typeof emailOrCredentials ===
        "string"
          ? {
              email:
                emailOrCredentials,
              password:
                password ?? "",
            }
          : emailOrCredentials;

      setLoading(true);
      setError("");

      try {
        const authenticatedUser =
          await signIn(
            credentials.email,
            credentials.password
          );

        if (!authenticatedUser) {
          throw new Error(
            "Authentication succeeded but no user account was returned."
          );
        }

        setUser(authenticatedUser);

        return {
          user: authenticatedUser,
        };
      } catch (caught) {
        const message =
          getErrorMessage(caught);

        setError(message);
        setUser(null);

        throw caught instanceof Error
          ? caught
          : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        await authSignOut();
      } catch (caught) {
        const message =
          getErrorMessage(caught);

        setError(message);

        throw caught instanceof Error
          ? caught
          : new Error(message);
      } finally {
        clearStoredAuth();
        setUser(null);
        setLoading(false);
      }
    }, []);

  const logout =
    useCallback(async () => {
      await signOut();
    }, [signOut]);

  return {
    user,
    loading,
    authenticated:
      Boolean(user),
    error,
    refresh: loadUser,
    signOut,
    logout,
    login,
  };
}

export default useAuth;