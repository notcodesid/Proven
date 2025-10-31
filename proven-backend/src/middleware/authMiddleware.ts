import { Request, Response, NextFunction } from "express";
import { jwtVerify, JWTPayload } from "jose";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_JWT_SECRET) {
  throw new Error("SUPABASE_URL and SUPABASE_JWT_SECRET environment variables are required");
}

// Encode the shared secret once so we can reuse it for verification.
const SUPABASE_SECRET = new TextEncoder().encode(SUPABASE_JWT_SECRET);

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

interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  role?: string;
}

/**
 * Production-ready authentication middleware for Supabase HS256 tokens.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
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

    console.log("Verifying token with Supabase JWT secret...");
    const verificationResult = await jwtVerify(token, SUPABASE_SECRET, {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });

    const payload = verificationResult.payload as SupabaseJwtPayload;
    console.log("✓ Token verified successfully");
    console.log("User ID:", payload.sub);
    console.log("Email:", payload.email);

    const isAdmin =
      !!payload.role &&
      ["admin", "ADMIN"].includes(String(payload.role).toLowerCase());

    req.user = {
      id: payload.sub,
      email: payload.email || "",
      name: payload.user_metadata?.full_name || payload.user_metadata?.name,
      image:
        payload.user_metadata?.avatar_url || payload.user_metadata?.picture,
      role: payload.role,
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
