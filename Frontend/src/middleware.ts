import { NextRequest, NextResponse } from "next/server";
import {
  staticRoutes,
  protectedRoutes,
  isValidRoute,
  findClosestRoute,
} from "@/lib/validRoutes";

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  console.log(token, "token ");
  const { pathname, search } = request.nextUrl;
  const fullPath = pathname + search;

  // Debug logging for production troubleshooting
  const isProduction = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  if (isProduction) {
    console.log("Middleware Debug:", {
      pathname,
      search,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      cookies: request.cookies
        .getAll()
        .map((c) => ({ name: c.name, hasValue: !!c.value })),
      userAgent: request.headers.get("user-agent")?.slice(0, 50),
    });
  }

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle malformed static route paths like /login/xyz
  for (const route of staticRoutes) {
    if (pathname !== route && pathname.startsWith(`${route}/`)) {
      // Extract any additional path segments
      const extraPath = pathname.substring(route.length + 1);

      // If it's just extra slashes or empty, redirect to the clean route
      if (!extraPath || extraPath.match(/^\/+$/)) {
        return NextResponse.redirect(new URL(route, request.url));
      }

      // If there are meaningful path segments, it might be a 404
      // Let it continue to the route validation below
    }
  }

  // Special handling for auth-related routes
  if (
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password/")
  ) {
    return NextResponse.next();
  }

  // Check if the current route is valid
  if (!isValidRoute(pathname)) {
    // Try to find a close match for potential typos
    const closestRoute = findClosestRoute(pathname);

    if (closestRoute) {
      // Redirect to the closest matching route
      console.log(
        `Redirecting ${pathname} to ${closestRoute} (typo correction)`
      );
      return NextResponse.redirect(new URL(closestRoute, request.url));
    }

    // If no close match found, this is a true 404
    // Let Next.js handle it with the not-found page
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is a dashboard with protected tabs
  const isDashboardTabRoute =
    pathname.includes("/dashboard") &&
    (pathname.includes("my-portfolio") ||
      pathname.includes("preferred-pitches") ||
      pathname.includes("my-pitches") ||
      pathname.includes("my-investors") ||
      search.includes("tab=my-portfolio") ||
      search.includes("tab=preferred-pitches") ||
      search.includes("tab=explore-pitches") ||
      search.includes("tab=my-pitches") ||
      search.includes("tab=my-investors") ||
      search.includes("tab=investor-search"));

  if (isProduction) {
    console.log("Protection Check:", {
      isProtectedRoute,
      isDashboardTabRoute,
      hasToken: !!token,
      pathname,
    });
  }

  // Redirect to login if accessing protected routes without token
  if ((isProtectedRoute || isDashboardTabRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set("redirect", fullPath);

    if (isProduction) {
      console.log("Redirecting to login:", {
        reason: "No token for protected route",
        from: fullPath,
        to: loginUrl.toString(),
      });
    }

    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/register, redirect appropriately
  if ((pathname === "/login" || pathname === "/register") && token) {
    // Check if there's a redirect parameter
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    if (
      redirectUrl &&
      redirectUrl !== "/login" &&
      redirectUrl !== "/register" &&
      isValidRoute(redirectUrl.split("?")[0]) // Validate the redirect URL
    ) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Handle direct access to dashboard without specific tabs
  if (
    pathname === "/investor/dashboard" ||
    pathname === "/enterpreneur/dashboard"
  ) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    // If authenticated but no tab specified, redirect to a default tab
    if (!search.includes("tab=")) {
      const defaultTab =
        pathname === "/investor/dashboard" ? "my-portfolio" : "my-pitches";
      return NextResponse.redirect(
        new URL(`${pathname}?tab=${defaultTab}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with an extension
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
