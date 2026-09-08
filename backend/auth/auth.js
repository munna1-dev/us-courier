import "dotenv/config";

import { requireSupabase } from "../lib/supabase.js";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  "admin@uscourier.app"
)
  .split(",")
  .map((email) =>
    email.trim().toLowerCase()
  )
  .filter(Boolean);

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

    if (name) {
      cookies[name] = decodeURIComponent(
        value
      );
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

  if (error || !data?.user) {
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
      .eq("id", user.id)
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
        message:
          "Authentication required.",
      });
    }

    req.auth = {
      user: result.user,
      profile: result.profile,
    };

    return next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(500).json({
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
        message:
          "Administrator authentication required.",
      });
    }

    const email =
      (
        result.user.email ||
        ""
      ).toLowerCase();

    const profileRole =
      result.profile?.role;

    const profileStatus =
      result.profile?.status;

    const isAllowlisted =
      ADMIN_EMAILS.includes(
        email
      );

    const isAdminRole =
      profileRole === "admin";

    const accountIsActive =
      !profileStatus ||
      profileStatus === "active";

    if (
      !accountIsActive ||
      (!isAllowlisted &&
        !isAdminRole)
    ) {
      return res.status(403).json({
        authenticated: true,
        authorized: false,
        message:
          "Administrator access is required.",
      });
    }

    req.auth = {
      user: result.user,
      profile: result.profile,
      isAdmin: true,
    };

    return next();
  } catch (error) {
    console.error(
      "Administrator authentication error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to verify administrator access.",
    });
  }
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