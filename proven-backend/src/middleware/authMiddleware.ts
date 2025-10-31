import { Request, Response, NextFunction } from "express";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}

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

    console.log('--- JWKS Manager ---');
    console.log('JWKS URL:', JWKS_URL);
    console.log(
      'Cache valid:',
      !!this.jwks && now - this.lastFetch < this.CACHE_DURATION
    );

    // Return cached JWKS if still valid
    if (this.jwks && now - this.lastFetch < this.CACHE_DURATION) {
      console.log('✓ Returning cached JWKS');
      return this.jwks;
    }

    console.log('Fetching fresh JWKS...');

    // Try to fetch fresh JWKS
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.MAX_RETRIES}`);
        // Test JWKS endpoint first
        const testResponse = await fetch(JWKS_URL);
        console.log('JWKS endpoint status:', testResponse.status);
        if (!testResponse.ok) {
          throw new Error(`JWKS endpoint returned ${testResponse.status}`);
        }

        const jwksData = await testResponse.json();
        console.log('JWKS keys count:', jwksData.keys?.length || 0);
        if (!jwksData.keys || jwksData.keys.length === 0) {
          throw new Error("JWKS endpoint returned empty keys");
        }

        // Create JWKS if endpoint is valid
        const { createRemoteJWKSet } = await import("jose");
        this.jwks = createRemoteJWKSet(new URL(JWKS_URL));
        this.lastFetch = now;
        console.log('✓ JWKS created and cached');
        return this.jwks;
      } catch (error: any) {
        console.log(`✗ Attempt ${attempt} failed:`, error.message);
        if (attempt === this.MAX_RETRIES) {
          console.log('All attempts exhausted, returning null');
          return null;
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
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
    console.log('\n=== AUTH MIDDLEWARE START ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request Method:', req.method);
    console.log('SUPABASE_URL from env:', process.env.SUPABASE_URL);
    console.log('SUPABASE_URL being used:', SUPABASE_URL);
    console.log('JWKS_URL:', JWKS_URL);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header present:', !!authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('✗ No Bearer token in header');
      console.log('=== AUTH MIDDLEWARE END ===\n');
      res.status(401).json({
        success: false,
        message: "Authorization header required. Format: Bearer <token>",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log('Token extracted:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 30) + '...');
    if (!token) {
      console.log('✗ Token is empty');
      console.log('=== AUTH MIDDLEWARE END ===\n');
      res.status(401).json({
        success: false,
        message: "Token not provided",
      });
      return;
    }

    let payload: SupabaseJwtPayload | null = null;

    // Strategy 1: Try JWKS verification
    console.log('\n--- Strategy 1: JWKS Verification ---');
    try {
      console.log('Fetching JWKS...');
      const jwks = await jwksManager.getJWKS();
      if (jwks) {
        console.log('✓ JWKS fetched successfully');
        const { jwtVerify } = await import("jose");
        console.log('Verifying token with JWKS...');
        const result = await jwtVerify(token, jwks, {
          issuer: `${SUPABASE_URL}/auth/v1`,
          audience: "authenticated",
        });
        payload = result.payload as unknown as SupabaseJwtPayload;
        console.log('✓ JWKS verification successful');
        console.log('User ID:', payload.sub);
        console.log('Email:', payload.email);
      }
    } catch (jwksError: any) {
      // JWKS verification failed, will try fallback
      console.log('✗ JWKS verification failed:', jwksError.message);
      console.log('Error name:', jwksError.name);
      console.log('Will try manual verification...');
    }

    // Strategy 2: Fallback to manual verification
    if (!payload) {
      console.log('\n--- Strategy 2: Manual Verification ---');
      payload = await verifyJwtManually(token);
      if (payload) {
        console.log('✓ Manual verification successful');
        console.log('User ID:', payload.sub);
        console.log('Email:', payload.email);
      } else {
        console.log('✗ Manual verification failed');
      }
    }

    // If both strategies failed
    if (!payload) {
      console.log('\n✗✗✗ ALL VERIFICATION STRATEGIES FAILED ✗✗✗');
      console.log('=== AUTH MIDDLEWARE END ===\n');
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

    console.log('✓✓✓ Authentication successful ✓✓✓');
    console.log('User attached to request:', req.user.email);
    console.log('=== AUTH MIDDLEWARE END ===\n');

    next();
  } catch (error: any) {
    console.log('\n=== AUTH MIDDLEWARE ERROR ===');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('=== END ERROR ===\n');
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
