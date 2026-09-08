import {
  getCurrentUser,
  signIn as apiSignIn,
  signOut as apiSignOut,
} from "./api";

import type {
  User,
  UserRole,
} from "../types";

const SIGNED_IN_KEY =
  "uscourier_signed_in";

const USER_KEY =
  "uscourier_user";

export function getStoredUser(): User | null {
  try {
    const value =
      localStorage.getItem(USER_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(
  user: User
): void {
  localStorage.setItem(
    SIGNED_IN_KEY,
    "true"
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

export function clearStoredAuth(): void {
  localStorage.removeItem(
    SIGNED_IN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );

  localStorage.removeItem(
    "uscourier_access_token"
  );
}

export function isSignedIn(): boolean {
  return (
    localStorage.getItem(
      SIGNED_IN_KEY
    ) === "true"
  );
}

/**
 * Return the currently stored authenticated user.
 *
 * This is intentionally synchronous so existing
 * dashboard components can use it without awaiting
 * an API request.
 */
export function getAuthUser(): User | null {
  return getStoredUser();
}

/**
 * Return the user's role from the supplied user
 * or from the locally stored authenticated user.
 */
export function getUserRole(
  user?: User | null
): UserRole | null {
  const currentUser =
    user ?? getStoredUser();

  if (!currentUser) {
    return null;
  }

  const role =
    currentUser.role ??
    currentUser.user_role ??
    currentUser.userRole;

  if (
    role === "customer" ||
    role === "admin" ||
    role === "manager" ||
    role === "courier"
  ) {
    return role;
  }

  return null;
}

/**
 * Authenticate a user through the API and
 * persist the returned user locally.
 */
export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const user =
    await apiSignIn(
      email,
      password
    );

  setStoredUser(user);

  return user;
}

export function getStoredRole():
  UserRole | null {
  return getUserRole();
}

export function getDashboardPath(
  user?: User | null
): string {
  const role =
    getUserRole(user);

  if (
    role === "admin" ||
    role === "manager" ||
    role === "courier"
  ) {
    return "/admin";
  }

  return "/dashboard";
}

/**
 * Synchronize local authentication state
 * with the backend session.
 */
export async function refreshAuth():
  Promise<User | null> {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      clearStoredAuth();
      return null;
    }

    setStoredUser(user);

    return user;
  } catch {
    clearStoredAuth();
    return null;
  }
}

/**
 * Sign out through the API and always clear
 * local authentication state.
 */
export async function signOut():
  Promise<void> {
  try {
    await apiSignOut();
  } finally {
    clearStoredAuth();
  }
}

/**
 * Require an authenticated user.
 *
 * Returns null when no valid backend session
 * exists.
 */
export async function requireAuth():
  Promise<User | null> {
  return refreshAuth();
}