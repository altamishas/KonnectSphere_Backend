export const staticRoutes = [
  // Core pages
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/account",
  "/verify-email",

  // Investment related routes
  "/investor/dashboard",
  "/explore-pitches",
  // Fundraising related routes
  "/enterpreneur/dashboard",
  "/add-pitch",
  "/complete-investor-profile",

  // Help center routes
  "/how-it-works",
  "/testimonials",
  "/faqs",
  "/contact",
  "/pricing",
  "/about",
  "/privacy-policy",
  "/terms",
  "/verify-email",
  // Additional routes
  "/my-investors",
  "/chat",
  "/search-investors",
  "/view-pitch",
  "/investor-search",
  "/payment/success",
  "/payment/failure",
  "/payment/pending",
  "/payment/cancelled",
  "/payment/refunded",
  "/payment/expired",
  "/payment/processing",
  "/payment/completed",
  "/subscription/success",
  "/not-found",
];

export const dynamicRoutes = [
  "/view-pitch", // handles /pitch/[id]
  "/investor", // handles /investor/[id] (if needed)
  "/reset-password",
];

// Protected routes that require authentication
export const protectedRoutes = [
  "/account",
  "/investor/dashboard",
  "/enterpreneur/dashboard",
  "/add-pitch",
  "/my-investors",
  "/chat",
];

// Dashboard tab routes (these are query-based routes that also need protection)
export const dashboardTabRoutes = [
  "/investor/dashboard?tab=my-portfolio",
  "/investor/dashboard?tab=preferred-pitches",
  "/investor/dashboard?tab=explore-pitches",
  "/enterpreneur/dashboard?tab=my-pitches",
  "/enterpreneur/dashboard?tab=my-investors",
  "/enterpreneur/dashboard?tab=investor-search",
];

// All valid routes combined for easier checking
export const allValidRoutes = [...staticRoutes, ...dynamicRoutes];

// Function to check if a route is valid (including dynamic routes)
export function isValidRoute(pathname: string): boolean {
  // Check static routes
  if (staticRoutes.includes(pathname)) {
    return true;
  }

  // Check dynamic routes
  for (const dynamicRoute of dynamicRoutes) {
    if (
      pathname.startsWith(`${dynamicRoute}/`) &&
      pathname.split("/").length >= 3
    ) {
      return true;
    }
  }
  if (pathname.startsWith("/reset-password/")) {
    return true;
  }

  // Consider root-level routes with known base that may have query strings handled elsewhere
  return false;
}

// Function to find the closest matching route for typo correction
export function findClosestRoute(pathname: string): string | null {
  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  let closestRoute = null;
  let minDistance = Infinity;

  for (const route of allRoutes) {
    const distance = levenshteinDistance(
      pathname.toLowerCase(),
      route.toLowerCase()
    );

    // Only consider it a typo if:
    // 1. The distance is small (≤ 3 character differences)
    // 2. The paths have similar length (within 3 characters)
    // 3. They share a common prefix or suffix
    if (
      distance <= 3 &&
      Math.abs(pathname.length - route.length) <= 3 &&
      (pathname.toLowerCase().startsWith(route.toLowerCase().substring(0, 3)) ||
        route.toLowerCase().startsWith(pathname.toLowerCase().substring(0, 3)))
    ) {
      if (distance < minDistance) {
        minDistance = distance;
        closestRoute = route;
      }
    }
  }

  return closestRoute;
}

// Helper function to calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}
