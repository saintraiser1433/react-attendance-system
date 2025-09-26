import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const pathname = url.pathname;

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") return NextResponse.redirect(new URL("/", url));
  } else if (pathname.startsWith("/teacher")) {
    if (!token || token.role !== "teacher") return NextResponse.redirect(new URL("/", url));
  } else if (pathname.startsWith("/student")) {
    // Block all student access - redirect to login
    return NextResponse.redirect(new URL("/", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};


