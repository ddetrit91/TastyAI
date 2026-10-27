import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isAuthPage } from "@/lib/auth-constants";

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
] as const;

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/offline") {
    return NextResponse.next();
  }

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (isAuthPage(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    if (!hasSession) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") {
      login.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/.*\\.png|icons/.*\\.svg).*)",
  ],
};
