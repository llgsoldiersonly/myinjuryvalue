import { NextRequest, NextResponse } from "next/server";

// Basic auth gate for /dashboard and /api/dashboard.
// Set DASHBOARD_USER + DASHBOARD_PASS in env.
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/dashboard") && !path.startsWith("/api/dashboard")) {
    return NextResponse.next();
  }

  const expected = `Basic ${Buffer.from(
    `${process.env.DASHBOARD_USER ?? "admin"}:${process.env.DASHBOARD_PASS ?? "change-me"}`
  ).toString("base64")}`;
  const got = req.headers.get("authorization");

  if (got === expected) return NextResponse.next();
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="dashboard"' },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
