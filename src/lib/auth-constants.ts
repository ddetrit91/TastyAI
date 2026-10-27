export const AUTH_COOKIE = "tasty_auth";

export const AUTH_PAGES = ["/login", "/register"] as const;

export function isAuthPage(pathname: string): boolean {
  return (AUTH_PAGES as readonly string[]).includes(pathname);
}
