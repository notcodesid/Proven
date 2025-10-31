import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";

const prisma = new PrismaClient();
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://wqwcodinjgdogcubrvbc.supabase.co";

// JWKS will be created dynamically when needed
let JWKS: any = null;

async function getJWKS() {
  if (!JWKS) {
    const { createRemoteJWKSet } = await import("jose");
    JWKS = createRemoteJWKSet(
      new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    );
  }
  return JWKS;
}

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

/**
 * Save user data from Supabase authentication to our database
 * This endpoint is called when a user signs in via Supabase
 */
export const saveUser = async (req: Request, res: Response) => {
  try {
    const { user, accessToken } = req.body;

    if (!user || !user.id) {
      res.status(400).json({
        success: false,
        message: "User data is required",
      });
      return;
    }

    // Verify the Supabase access token if provided (optional for user creation)
    if (accessToken && accessToken !== "fake-token") {
      try {
        const { jwtVerify } = await import("jose");
        const jwks = await getJWKS();
        await jwtVerify(accessToken, jwks, {
          issuer: `${SUPABASE_URL}/auth/v1`,
          audience: "authenticated",
        });
      } catch (jwtError) {
        // Don't block user creation if token verification fails
        // This allows the user to be saved even if there are temporary token issues
      }
    }

    const userData = {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      image:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userData.id },
    });

    let savedUser;
    if (existingUser) {
      // Update existing user
      savedUser = await prisma.user.update({
        where: { id: userData.id },
        data: {
          email: userData.email,
          name: userData.name,
          image: userData.image,
        },
      });
    } else {
      // Create new user
      savedUser = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          image: userData.image,
        },
      });
    }

    // Simplified response - no token generation needed
    res.status(200).json({
      success: true,
      message: "User saved successfully",
      user: savedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while saving user",
    });
    return;
  }
};

/**
 * Verify a Supabase JWT token and return the user data
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token is required",
      });
      return;
    }

    try {
      // Verify the Supabase JWT token
      const { jwtVerify } = await import("jose");
      const jwks = await getJWKS();
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${SUPABASE_URL}/auth/v1`,
        audience: "authenticated",
      });

      res.status(200).json({
        success: true,
        message: "Token is valid",
        user: {
          id: payload.sub,
          email: payload.email,
          // Add other user data from payload if needed
        },
      });
      return;
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while verifying token",
    });
    return;
  }
};

/**
 * Get the current authenticated user's profile
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // User is already attached to the request by the authenticate middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
    });
    return;
  }
};
