import { Router } from "express";

import {
  clearAuthCookie,
  getAuthenticatedUser,
  requireAuth,
  setAuthCookie,
} from "../auth/auth.js";

import { requireSupabase } from "../lib/supabase.js";

const router = Router();

function getBodyString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getProfileUser(authenticated) {
  if (authenticated?.profile) {
    return authenticated.profile;
  }

  if (authenticated?.user) {
    return {
      id: authenticated.user.id,
      email: authenticated.user.email || "",
    };
  }

  return null;
}

router.get(
  "/me",
  async (req, res) => {
    try {
      const result =
        await getAuthenticatedUser(req);

      if (
        result.error ||
        !result.user
      ) {
        return res.status(401).json({
          authenticated: false,
          user: null,
        });
      }

      return res.status(200).json({
        authenticated: true,
        user:
          getProfileUser(result),
      });
    } catch (error) {
      console.error(
        "Auth /me failed:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve the current user.",
      });
    }
  }
);

router.post(
  "/signin",
  async (req, res) => {
    const email =
      getBodyString(
        req.body?.email
      );

    const password =
      typeof req.body?.password ===
      "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error || !data?.user) {
        return res.status(401).json({
          message:
            error?.message ||
            "Invalid email or password.",
        });
      }

      if (data.session?.access_token) {
        setAuthCookie(
          res,
          data.session.access_token
        );
      }

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
            data.user.id
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "Sign-in profile query failed:",
          profileError
        );
      }

      return res.status(200).json({
        authenticated: true,
        user:
          profile || {
            id: data.user.id,
            email:
              data.user.email || "",
          },
      });
    } catch (error) {
      console.error(
        "Sign-in failed:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to sign in.",
      });
    }
  }
);

router.post(
  "/signup",
  async (req, res) => {
    const firstName =
      getBodyString(
        req.body?.firstName
      );

    const lastName =
      getBodyString(
        req.body?.lastName
      );

    const email =
      getBodyString(
        req.body?.email
      );

    const password =
      typeof req.body?.password ===
      "string"
        ? req.body.password
        : "";

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "First name, last name, email, and password are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                first_name:
                  firstName,
                last_name:
                  lastName,
              },
            },
          }
        );

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to create the account.",
        });
      }

      if (!data?.user) {
        return res.status(400).json({
          message:
            "The account could not be created.",
        });
      }

      if (data.session?.access_token) {
        setAuthCookie(
          res,
          data.session.access_token
        );
      }

      let profile = null;

      const {
        data: existingProfile,
        error:
          profileError,
      } =
        await supabase
          .from("users")
          .select("*")
          .eq(
            "id",
            data.user.id
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "Sign-up profile query failed:",
          profileError
        );
      } else {
        profile =
          existingProfile;
      }

      return res.status(201).json({
        authenticated:
          Boolean(data.session),
        user:
          profile || {
            id: data.user.id,
            email:
              data.user.email || email,
            first_name:
              firstName,
            firstName,
              last_name:
              lastName,
            lastName,
            role: "customer",
            user_role: "customer",
            userRole: "customer",
            status: "active",
            account_status:
              "active",
            accountStatus: "active",
          },
      });
    } catch (error) {
      console.error(
        "Sign-up failed:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create the account.",
      });
    }
  }
);

router.post(
  "/signout",
  async (req, res) => {
    try {
      const token =
        req.headers.authorization ||
        null;

      if (token) {
        const supabase =
          requireSupabase();

        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error(
        "Sign-out error:",
        error
      );
    }

    clearAuthCookie(res);

    return res.status(200).json({
      authenticated: false,
      user: null,
    });
  }
);

router.get(
  "/profile",
  requireAuth,
  (req, res) => {
    return res.status(200).json({
      authenticated: true,
      user:
        getProfileUser(
          req.auth
        ),
    });
  }
);

export default router;
