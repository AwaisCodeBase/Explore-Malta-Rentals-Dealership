import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  extractLocaleFromPathname,
  isAdminProtectedPath,
} from "@/lib/admin-auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isPublicAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin/auth/login" || pathname === "/api/admin/auth/logout";
}

function isProtectedAdminApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/admin/") && !isPublicAdminApiPath(pathname);
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Static shareable HTML (public/design-renewal) — skip locale prefixing
  if (pathname === "/design-renewal" || pathname.startsWith("/design-renewal/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    if (isProtectedAdminApiPath(pathname)) {
      const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim();
      if (!sessionToken) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  if (isAdminProtectedPath(pathname)) {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim();
    if (!sessionToken) {
      const locale = extractLocaleFromPathname(pathname) ?? routing.defaultLocale;
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/admin/login`;
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|design-renewal|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};
