// ============================================================
// PM TOOL REPO — src/app/api/employees/route.js
//
// Reads employees from the Employee Portal's Postgres (Supabase).
// Server-only. Never selects the password column.
//
// .env.local (PM tool, project root):
//   EMPLOYEE_DATABASE_URL="postgresql://user:password@host:5432/postgres?sslmode=no-verify"
//   EMPLOYEE_TABLE=Employee        (optional, defaults to "Employee")
//
// npm i pg   (then restart npm run dev)
// ============================================================

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One pool shared across hot reloads so dev doesn't exhaust connections.
const g = globalThis;
function getPool() {
  if (!g.__employeePool) {
    g.__employeePool = new Pool({
      connectionString: process.env.EMPLOYEE_DATABASE_URL,
      max: 3,
    });
  }
  return g.__employeePool;
}

function fail(message, status = 500) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET() {
  const url = process.env.EMPLOYEE_DATABASE_URL || "";
  if (!/^postgres(ql)?:\/\//.test(url)) {
    return fail(
      "EMPLOYEE_DATABASE_URL is missing or not a postgresql:// URL. Check .env.local and restart the dev server."
    );
  }

  // Table names can't be parameterized, so allow plain identifiers only.
  const table = process.env.EMPLOYEE_TABLE || "Employee";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) return fail("Invalid EMPLOYEE_TABLE");

  const pool = getPool();

  try {
    let rows;
    try {
      ({ rows } = await pool.query(
        `SELECT "employeeId", "name", "department" FROM "${table}" ORDER BY "name"`
      ));
    } catch (err) {
      // 42703 = undefined_column: the table has no "department" column.
      if (err.code !== "42703") throw err;
      ({ rows } = await pool.query(
        `SELECT "employeeId", "name" FROM "${table}" ORDER BY "name"`
      ));
    }

    const employees = rows
      .filter((r) => r.employeeId)
      .map((r) => ({
        employeeId: String(r.employeeId),
        name: r.name ? String(r.name).trim() : "Unnamed",
        department: r.department ? String(r.department) : "",
      }));

    return NextResponse.json({ success: true, employees });
  } catch (err) {
    return fail(err.message, 502);
  }
}