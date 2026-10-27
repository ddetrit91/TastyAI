import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE_NAME = "tasty_session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing && existing.length >= 16) {
    return existing;
  }

  const id = randomUUID();
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
