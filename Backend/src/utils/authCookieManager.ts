import { Response } from "express";
import { config } from "../config/config";

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  domain?: string;
  path?: string;
}

export class AuthCookieManager {
  /**
   * Set authentication cookie with proper cross-domain configuration
   */
  static setAuthCookie(res: Response, token: string): void {
    const isProduction = config.NODE_ENV === "production";
    const frontendDomain = config.FRONTEND_URL;

    // Extract domain from frontend URL for cross-domain cookies
    let cookieDomain: string | undefined;
    if (isProduction && frontendDomain) {
      try {
        const url = new URL(frontendDomain);
        // For cross-domain cookies, we need to handle Vercel domains specially
        if (url.hostname.includes("vercel.app")) {
          // Don't set domain for Vercel deployments - let browser handle it
          cookieDomain = undefined;
        } else {
          // For custom domains, extract the main domain
          const domainParts = url.hostname.split(".");
          if (domainParts.length > 2) {
            cookieDomain = `.${domainParts.slice(-2).join(".")}`;
          } else {
            cookieDomain = url.hostname;
          }
        }
      } catch (error) {
        console.warn("Failed to parse frontend URL for cookie domain:", error);
        cookieDomain = undefined;
      }
    }

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // Critical: "none" for cross-domain in production
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      path: "/",
    };

    // Only set domain if we determined one
    if (cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    console.log("🍪 Setting auth cookie with options:", {
      isProduction,
      frontendDomain,
      cookieDomain,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
    });

    res.cookie("token", token, cookieOptions);

    // Also set a fallback cookie that frontend can read for middleware
    res.cookie("auth_status", "authenticated", {
      httpOnly: false, // Frontend can read this
      secure: isProduction,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: "/",
      ...(cookieDomain && { domain: cookieDomain }),
    });
  }

  /**
   * Clear authentication cookies
   */
  static clearAuthCookies(res: Response): void {
    const isProduction = config.NODE_ENV === "production";
    const frontendDomain = config.FRONTEND_URL;

    let cookieDomain: string | undefined;
    if (isProduction && frontendDomain) {
      try {
        const url = new URL(frontendDomain);
        if (!url.hostname.includes("vercel.app")) {
          const domainParts = url.hostname.split(".");
          if (domainParts.length > 2) {
            cookieDomain = `.${domainParts.slice(-2).join(".")}`;
          } else {
            cookieDomain = url.hostname;
          }
        }
      } catch (error) {
        console.warn(
          "Failed to parse frontend URL for cookie clearing:",
          error
        );
      }
    }

    const clearOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
      ...(cookieDomain && { domain: cookieDomain }),
    };

    console.log("🗑️ Clearing auth cookies with options:", clearOptions);

    res.clearCookie("token", clearOptions);
    res.clearCookie("auth_status", {
      ...clearOptions,
      httpOnly: false,
    });
  }

  /**
   * Set dual authentication (cookie + localStorage token) for cross-domain compatibility
   */
  static setDualAuth(res: Response, token: string): void {
    // Set the HTTP-only cookie
    this.setAuthCookie(res, token);

    // Also return token in response for localStorage fallback
    // The frontend axios interceptor will store this in localStorage
  }
}

export default AuthCookieManager;
