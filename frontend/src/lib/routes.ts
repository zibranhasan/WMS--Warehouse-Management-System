export const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];



export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/change-password",
  "/users",
  "/warehouses",
  "/zones",
  "/aisles",
  "/shelves",
  "/bins",
  "/categories",
  "/brands",
  "/products",
  "/inventory",
  "/suppliers",
  "/purchase-orders",
  "/sales-orders",
  "/picking",
  "/packing",
  "/shipping",
];

// Role-based route access limits
export const ROLE_ROUTE_OWNERSHIP: Record<string, string[]> = {
  "/users": ["SUPER_ADMIN", "ADMIN"],
};

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isRoleAllowedForRoute(pathname: string, role: string): boolean {
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTE_OWNERSHIP)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}
