import { NextRequest, NextResponse } from "next/server";

async function verify(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expires, signature] = parts;
  if (!id || Number(expires) < Date.now()) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${expires}`)
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("admin_session")?.value;
  const secret = process.env.SESSION_SECRET;
  const loggedIn = !!(token && secret && (await verify(token, secret)));

  if (pathname === "/admin/login") {
    // Already signed in: skip the login form.
    return loggedIn
      ? NextResponse.redirect(new URL("/admin", req.url))
      : NextResponse.next();
  }

  if (loggedIn) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};