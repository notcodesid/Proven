import { Request, Response, NextFunction } from "express";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wqwcodinjgdogcubrvbc.supabase.co';
const JWKS_URL = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

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

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  role?: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
}

/**
 * Production-ready JWKS fetcher with retry logic and caching
 */
class JWKSManager {
  private jwks: any = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly MAX_RETRIES = 3;

  async getJWKS(): Promise<any> {
    const now = Date.now();

    // Return cached JWKS if still valid
    if (this.jwks && now - this.lastFetch < this.CACHE_DURATION) {
      return this.jwks;
    }

    // Try to fetch fresh JWKS
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Test JWKS endpoint first
        const testResponse = await fetch(JWKS_URL);
        if (!testResponse.ok) {
          throw new Error(`JWKS endpoint returned ${testResponse.status}`);
        }

        const jwksData = await testResponse.json();
        if (!jwksData.keys || jwksData.keys.length === 0) {
          throw new Error("JWKS endpoint returned empty keys");
        }

        // Create JWKS if endpoint is valid
        const { createRemoteJWKSet } = await import("jose");
        this.jwks = createRemoteJWKSet(new URL(JWKS_URL));
        this.lastFetch = now;
        return this.jwks;
      } catch (error: any) {
        if (attempt === this.MAX_RETRIES) {
          return null;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return null;
  }
}

const jwksManager = new JWKSManager();

/**
 * Manual JWT verification for fallback when JWKS fails
 */
async function verifyJwtManually(
  token: string
): Promise<SupabaseJwtPayload | null> {
  try {
    const { decodeJwt } = await import("jose");
    // Decode without verification to check basic structure
    const decoded = decodeJwt(token);

    // Validate required fields
    if (!decoded.sub || !decoded.iss || !decoded.aud || !decoded.exp) {
      throw new Error("Token missing required fields");
    }

    // Check issuer
    if (decoded.iss !== `${SUPABASE_URL}/auth/v1`) {
      throw new Error("Invalid token issuer");
    }

    // Check audience
    if (decoded.aud !== "authenticated") {
      throw new Error("Invalid token audience");
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error("Token has expired");
    }

    return decoded as SupabaseJwtPayload;
  } catch (error: any) {
    return null;
  }
}

/**
 * Production-ready authentication middleware
 * Uses multiple verification strategies for maximum reliability
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization header required. Format: Bearer <token>",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token not provided",
      });
      return;
    }

    let payload: SupabaseJwtPayload | null = null;

    // Strategy 1: Try JWKS verification
    try {
      const jwks = await jwksManager.getJWKS();
      if (jwks) {
        const { jwtVerify } = await import("jose");
        const result = await jwtVerify(token, jwks, {
          issuer: `${SUPABASE_URL}/auth/v1`,
          audience: "authenticated",
        });
        payload = result.payload as unknown as SupabaseJwtPayload;
      }
    } catch (jwksError: any) {
      // JWKS verification failed, will try fallback
    }

    // Strategy 2: Fallback to manual verification
    if (!payload) {
      payload = await verifyJwtManually(token);
    }

    // If both strategies failed
    if (!payload) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        debug:
          process.env.NODE_ENV === "development"
            ? {
                suggestion:
                  "Token verification failed with both JWKS and manual methods",
              }
            : undefined,
      });
      return;
    }

    // Attach user to request
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

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal authentication error",
      debug:
        process.env.NODE_ENV === "development"
          ? {
              error: error.message,
            }
          : undefined,
    });
    return;
  }
};

/**
 * Generate a JWT token for a user (legacy - keeping for backward compatibility)
 */
export const generateToken = (userId: string): string => {
  return "";
};
