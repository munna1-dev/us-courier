import "dotenv/config";

import { requireSupabase } from "../lib/supabase.js";

const SUPER_ADMIN_EMAIL = "admin@uscourier.app";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  SUPER_ADMIN_EMAIL
)
  .split(",")
  .map((email) =>
    email.trim().toLowerCase()
  )
  .filter(Boolean);

export const ROLE_PERMISSIONS = {
  super_admin: [
    "*",
    "shipment.read",
    "shipment.create",
    "shipment.update",
    "shipment.delete",
    "shipment.dispatch",
    "user.read",
    "user.create",
    "user.update",
    "user.delete",
    "role.assign",
    "role.manage",
    "operations.manage",
    "tracking.read",
    "report.read",
    "settings.manage",
    "audit.read",
  ],

  admin: [
    "shipment.read",
    "shipment.create",
    "shipment.update",
    "shipment.delete",
    "shipment.dispatch",
    "user.read",
    "user.create",
    "user.update",
    "operations.manage",
    "tracking.read",
    "report.read",
    "audit.read",
  ],

  manager: [
    "shipment.read",
    "shipment.create",
    "shipment.update",
    "shipment.dispatch",
    "tracking.read",
    "report.read",
  ],

  courier: [
    "shipment.read",
    "shipment.dispatch",
  ],

  support: [
    "tracking.read",
  ],

  viewer: [
    "tracking.read",
    "report.read",
  ],

  customer: [],
};

export const VALID_ROLES = Object.keys(
  ROLE_PERMISSIONS
);

function getBearerToken(req) {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  const token =
    authorization.slice(7).trim();

  return token || null;
}

function getCookieToken(req) {
  const cookieHeader =
    req.headers.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  const cookies = {};

  for (
    const part of cookieHeader.split(";")
  ) {
    const separator =
      part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name =
      part
        .slice(0, separator)
        .trim();

    const value =
      part
        .slice(separator + 1)
        .trim();

    if (!name) {
      continue;
    }

    try {
      cookies[name] =
        decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return (
    cookies.access_token ||
    cookies.supabase_access_token ||
    cookies.sb_access_token ||
    null
  );
}

export function getAccessToken(req) {
  return (
    getBearerToken(req) ||
    getCookieToken(req)
  );
}

export async function getAuthenticatedUser(
  req
) {
  const token =
    getAccessToken(req);

  if (!token) {
    return {
      user: null,
      profile: null,
      error: null,
    };
  }

  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    error ||
    !data?.user
  ) {
    return {
      user: null,
      profile: null,
      error:
        error ||
        new Error(
          "Invalid authentication token."
        ),
    };
  }

  const user =
    data.user;

  const {
    data: profile,
    error:
      profileError,
  } =
    await supabase
      .from("users")
      .select("*")
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (profileError) {
    return {
      user,
      profile: null,
      error: profileError,
    };
  }

  return {
    user,
    profile,
    error: null,
  };
}

function normalizeRole(
  profile
) {
  const role =
    profile?.role ??
    profile?.user_role ??
    profile?.userRole;

  if (
    typeof role !== "string"
  ) {
    return null;
  }

  const normalized =
    role.trim().toLowerCase();

  return ROLE_PERMISSIONS[
    normalized
  ]
    ? normalized
    : null;
}

function normalizeStatus(
  profile
) {
  const status =
    profile?.status ??
    profile?.account_status ??
    profile?.accountStatus;

  if (
    typeof status !== "string"
  ) {
    return "active";
  }

  return (
    status.trim().toLowerCase() ||
    "active"
  );
}

function getPermissions(
  role
) {
  return (
    ROLE_PERMISSIONS[
      role
    ] || []
  );
}

export function hasPermission(
  role,
  permission
) {
  const permissions =
    getPermissions(role);

  return (
    permissions.includes("*") ||
    permissions.includes(
      permission
    )
  );
}

export async function getManagementIdentity(
  req
) {
  const result =
    await getAuthenticatedUser(
      req
    );

  if (
    result.error ||
    !result.user
  ) {
    return {
      authenticated: false,
      authorized: false,
      user: null,
      profile: null,
      role: null,
      permissions: [],
      isSuperAdmin: false,
    };
  }

  const email = (
    result.user.email ||
    ""
  )
    .trim()
    .toLowerCase();

  const isSuperAdmin =
    email ===
    SUPER_ADMIN_EMAIL;

  const isAllowlisted =
    ADMIN_EMAILS.includes(
      email
    );

  const profile =
    result.profile;

  const profileRole =
    normalizeRole(profile);

  const status =
    normalizeStatus(profile);

  /*
   * The dedicated Super Admin identity
   * always resolves to super_admin.
   */
  if (isSuperAdmin) {
    return {
      authenticated: true,
      authorized: true,
      user: result.user,
      profile,
      role: "super_admin",
      permissions:
        getPermissions(
          "super_admin"
        ),
      isSuperAdmin: true,
    };
  }

  /*
   * Other explicitly allowlisted
   * management accounts retain admin
   * access unless their profile defines
   * another valid management role.
   */
  if (
    isAllowlisted &&
    !profileRole
  ) {
    return {
      authenticated: true,
      authorized:
        status === "active",
      user: result.user,
      profile,
      role:
        status === "active"
          ? "admin"
          : null,
      permissions:
        status === "active"
          ? getPermissions(
              "admin"
            )
          : [],
      isSuperAdmin: false,
    };
  }

  /*
   * A profile must have an explicit
   * recognized role to enter management.
   */
  if (
    !profileRole ||
    status !== "active"
  ) {
    return {
      authenticated: true,
      authorized: false,
      user: result.user,
      profile,
      role: profileRole,
      permissions: [],
      isSuperAdmin: false,
    };
  }

  /*
   * Customers are authenticated users,
   * but they are not management users.
   */
  if (
    profileRole ===
    "customer"
  ) {
    return {
      authenticated: true,
      authorized: false,
      user: result.user,
      profile,
      role: "customer",
      permissions: [],
      isSuperAdmin: false,
    };
  }

  return {
    authenticated: true,
    authorized: true,
    user: result.user,
    profile,
    role: profileRole,
    permissions:
      getPermissions(
        profileRole
      ),
    isSuperAdmin: false,
  };
}

export async function requireAuth(
  req,
  res,
  next
) {
  try {
    const result =
      await getAuthenticatedUser(
        req
      );

    if (
      result.error ||
      !result.user
    ) {
      return res.status(401).json({
        authenticated: false,
        authorized: false,
        message:
          "Authentication required.",
      });
    }

    req.auth = {
      user: result.user,
      profile:
        result.profile,
    };

    return next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(500).json({
      authenticated: false,
      message:
        "Unable to verify authentication.",
    });
  }
}

export async function requireAdmin(
  req,
  res,
  next
) {
  try {
    const identity =
      await getManagementIdentity(
        req
      );

    if (
      !identity.authenticated
    ) {
      return res.status(401).json({
        authenticated: false,
        authorized: false,
        message:
          "Management authentication required.",
      });
    }

    if (
      !identity.authorized
    ) {
      return res.status(403).json({
        authenticated: true,
        authorized: false,
        message:
          "Management authorization is required.",
      });
    }

    req.auth = {
      user:
        identity.user,
      profile:
        identity.profile,
      role:
        identity.role,
      permissions:
        identity.permissions,
      isAdmin: true,
      isSuperAdmin:
        identity.isSuperAdmin,
    };

    return next();
  } catch (error) {
    console.error(
      "Management authorization error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to verify management access.",
    });
  }
}

export function requirePermission(
  permission
) {
  return async (
    req,
    res,
    next
  ) => {
    try {
      const identity =
        await getManagementIdentity(
          req
        );

      if (
        !identity.authenticated
      ) {
        return res.status(401).json({
          authenticated: false,
          authorized: false,
          message:
            "Authentication required.",
        });
      }

      if (
        !identity.authorized
      ) {
        return res.status(403).json({
          authenticated: true,
          authorized: false,
          message:
            "Management authorization is required.",
        });
      }

      if (
        !hasPermission(
          identity.role,
          permission
        )
      ) {
        return res.status(403).json({
          authenticated: true,
          authorized: true,
          permission,
          message:
            "You do not have permission to perform this action.",
        });
      }

      req.auth = {
        user:
          identity.user,
        profile:
          identity.profile,
        role:
          identity.role,
        permissions:
          identity.permissions,
        isAdmin: true,
        isSuperAdmin:
          identity.isSuperAdmin,
      };

      return next();
    } catch (error) {
      console.error(
        "Permission authorization error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to verify management permission.",
      });
    }
  };
}

export function clearAuthCookie(
  res
) {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  const cookieParts = [
    "access_token=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (isProduction) {
    cookieParts.push(
      "Secure"
    );
  }

  res.setHeader(
    "Set-Cookie",
    cookieParts.join("; ")
  );
}

export function setAuthCookie(
  res,
  accessToken
) {
  if (!accessToken) {
    return;
  }

  const isProduction =
    process.env.NODE_ENV ===
    "production";

  const cookieParts = [
    `access_token=${encodeURIComponent(
      accessToken
    )}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (isProduction) {
    cookieParts.push(
      "Secure"
    );
  }

  res.setHeader(
    "Set-Cookie",
    cookieParts.join("; ")
  );
}