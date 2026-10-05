import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_HOURS = 8;

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const adminId = process.env.ADMIN_EMPLOYEE_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminId || !adminPassword || !secret) {
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }

  let body: { employeeId?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const idOk = safeEqual(body.employeeId ?? "", adminId);
  const pwOk = safeEqual(body.password ?? "", adminPassword);

  if (!idOk || !pwOk) {
    return NextResponse.json(
      { error: "Invalid employee ID or password." },
      { status: 401 }
    );
  }

  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${adminId}.${expires}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  const res = NextResponse.json({
    ok: true,
    user: { name: "Admin", employeeId: adminId, role: "admin" },
  });
  res.cookies.set("admin_session", `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
  return res;
}