import {
  getCurrentUser,
  signIn as apiSignIn,
  signOut as apiSignOut,
} from "./api";

import type {
  User,
  UserRole,
} from "../types";

const SIGNED_IN_KEY = "uscourier_signed_in";
const USER_KEY = "uscourier_user";

const MANAGEMENT_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "courier",
  "support",
  "viewer",
] as const;

export function setStoredUser(user: User): void {
  localStorage.setItem(SIGNED_IN_KEY, "true");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem(SIGNED_IN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("uscourier_access_token");
}

export function isSignedIn(): boolean {
  return localStorage.getItem(SIGNED_IN_KEY) === "true";
}

export function getAuthUser(): User | null {
  return getStoredUser();
}

export function getUserRole(
  user?: User | null
): UserRole | null {
  const currentUser = user ?? getStoredUser();

  if (!currentUser) {
    return null;
  }

  const rawRole =
    currentUser.role ??
    currentUser.user_role ??
    currentUser.userRole;

  if (typeof rawRole !== "string") {
    return null;
  }

  const role = rawRole.trim().toLowerCase();

  if (role === "customer") {
    return "customer";
  }

  if (
    MANAGEMENT_ROLES.includes(
      role as (typeof MANAGEMENT_ROLES)[number]
    )
  ) {
    return role as UserRole;
  }

  return null;
}

export function isManagementUser(
  user?: User | null
): boolean {
  const role = getUserRole(user);

  return Boolean(
    role &&
    role !== "customer"
  );
}

export function getDashboardPath(
  user?: User | null
): string {
  return isManagementUser(user)
    ? "/admin"
    : "/dashboard";
}

export function getRoleLabel(
  user?: User | null
): string {
  switch (getUserRole(user)) {
    case "super_admin":
      return "Super Admin";

    case "admin":
      return "Administrator";

    case "manager":
      return "Manager";

    case "courier":
      return "Courier";

    case "support":
      return "Support";

    case "viewer":
      return "Viewer";

    case "customer":
      return "Customer";

    default:
      return "User";
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const user = await apiSignIn(
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

export async function refreshAuth():
  Promise<User | null> {
  try {
    const user = await getCurrentUser();

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

export async function signOut():
  Promise<void> {
  try {
    await apiSignOut();
  } finally {
    clearStoredAuth();
  }
}

export async function requireAuth():
  Promise<User | null> {
  return refreshAuth();
}
