import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

// Extended Request interface with user property
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: string;
    isAdmin?: boolean;
  };
}

/**
 * Production-ready authentication middleware using Supabase Admin client.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured."
    );
  }

  try {
    console.log("\n=== AUTH MIDDLEWARE START ===");
    console.log("Request URL:", req.originalUrl);
    console.log("Request Method:", req.method);
    console.log("SUPABASE_URL from env:", process.env.SUPABASE_URL);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log("Authorization header present:", !!authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("✗ No Bearer token in header");
      console.log("=== AUTH MIDDLEWARE END ===\n");
      res.status(401).json({
        success: false,
        message: "Authorization header required. Format: Bearer <token>",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", !!token);
    console.log("Token length:", token?.length);
    console.log("Token preview:", token?.substring(0, 30) + "...");
    if (!token) {
      console.log("✗ Token is empty");
      console.log("=== AUTH MIDDLEWARE END ===\n");
      res.status(401).json({
        success: false,
        message: "Token not provided",
      });
      return;
    }

    console.log("Verifying token with Supabase admin client...");
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.log("✗ Supabase auth.getUser failed:", error?.message);
      console.log("=== AUTH MIDDLEWARE END ===\n");
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    const user = data.user;
    console.log("✓ Token verified successfully");
    console.log("User ID:", user.id);
    console.log("Email:", user.email);

    const isAdmin =
      !!user.role &&
      ["admin", "ADMIN"].includes(String(user.role).toLowerCase());

    req.user = {
      id: user.id,
      email: user.email || "",
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined),
      image:
        (user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined),
      role: user.role,
      isAdmin,
    };

    console.log("✓✓✓ Authentication successful ✓✓✓");
    console.log("User attached to request:", req.user.email);
    console.log("=== AUTH MIDDLEWARE END ===\n");

    next();
  } catch (error: any) {
    console.log("✗ Token verification failed:", error?.message);
    console.log("Stack:", error?.stack);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Generate a JWT token for a user (legacy - keeping for backward compatibility)
 */
export const generateToken = (userId: string): string => {
  return "";
};
