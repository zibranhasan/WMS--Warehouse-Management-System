import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicRoute, isRoleAllowedForRoute } from "@/lib/routes";

const AUTH_ME_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth/me`
  : "http://localhost:5000/api/v1/auth/me";

/**
 * Validates the session with the backend by forwarding request cookies.
 * Does not decode or log session tokens.
 */
async function verifySession(cookieHeader: string) {
  try {
    const res = await fetch(AUTH_ME_URL, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (res.status === 200) {
      const data = await res.json();
      if (data?.success && data?.data?.user) {
        return { authenticated: true, user: data.data.user };
      }
    }
    return { authenticated: false, user: null };
  } catch {
    // Fail safely on error
    return { authenticated: false, user: null };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie") ?? "";

  // Check if Better Auth session cookie exists
  const hasSessionCookie =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token") ||
    request.cookies.has("better-auth.session_data");

  const isPublic = isPublicRoute(pathname);

  // 1. Handle public routes (e.g. /login)
  if (isPublic) {
    if (hasSessionCookie) {
      const { authenticated, user } = await verifySession(cookieHeader);
      if (authenticated && user) {
        if (user.needPasswordChange) {
          return NextResponse.redirect(new URL("/change-password", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Handle protected routes
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { authenticated, user } = await verifySession(cookieHeader);

  if (!authenticated || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Enforce password change for users requiring it
  if (user.needPasswordChange && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // 4. Handle role-based route ownership (e.g. /users -> SUPER_ADMIN, ADMIN)
  if (!isRoleAllowedForRoute(pathname, user.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Redirect root route '/' to '/dashboard' or '/change-password' for authenticated users
  if (pathname === "/") {
    if (user.needPasswordChange) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();

}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|well-known|api).*)",
  ],
};
