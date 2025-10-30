import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { logger } from "../../lib/logger";

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

    logger.info('[auth] saveUser invoked', {
      userId: user?.id,
      email: user?.email,
      hasAccessToken: !!accessToken,
      accessTokenPreview: preview(accessToken),
    });

    if (!user || !user.id) {
      logger.warn('[auth] saveUser missing user payload');
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
        logger.debug('[auth] verifying Supabase token in saveUser');
        await jwtVerify(accessToken, jwks, {
          issuer: `${SUPABASE_URL}/auth/v1`,
          audience: "authenticated",
        });
        logger.debug('[auth] Supabase token verified successfully');
      } catch (jwtError) {
        // Don't block user creation if token verification fails
        // This allows the user to be saved even if there are temporary token issues
        logger.warn('[auth] Supabase token verification failed during saveUser', {
          error: (jwtError as Error)?.message,
        });
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
      logger.debug('[auth] updating existing user', {
        userId: userData.id,
      });
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
      logger.debug('[auth] creating new user record', {
        userId: userData.id,
      });
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
    logger.error('[auth] saveUser failed', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
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

    logger.info('[auth] verifyToken invoked', {
      hasToken: !!token,
      tokenPreview: preview(token),
    });

    if (!token) {
      logger.warn('[auth] verifyToken called without token');
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
      logger.debug('[auth] verifying token via JWKS in verifyToken');
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${SUPABASE_URL}/auth/v1`,
        audience: "authenticated",
      });

      logger.debug('[auth] token verified successfully', {
        subject: payload.sub,
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
      logger.warn('[auth] verifyToken failed', {
        error: (jwtError as Error).message,
      });
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }
  } catch (error) {
    logger.error('[auth] verifyToken encountered server error', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
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
      logger.warn('[auth] getCurrentUser called without authenticated user', {
        url: req.originalUrl,
      });
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    logger.debug('[auth] getCurrentUser success', {
      userId: req.user.id,
      email: req.user.email,
    });

    res.status(200).json({
      success: true,
      user: req.user,
    });
    return;
  } catch (error) {
    logger.error('[auth] getCurrentUser failed', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
    });
    return;
  }
};

const preview = (value?: string) =>
  value ? `${value.substring(0, 12)}...` : undefined;
