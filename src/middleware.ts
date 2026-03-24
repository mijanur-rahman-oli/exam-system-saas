import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/super-admin") && token?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/admin") && !["admin", "super_admin"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/question-setter") && token?.role !== "question_setter") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/student") && token?.role !== "student") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/admin/:path*",
    "/question-setter/:path*",
    "/student/:path*",
    "/dashboard/:path*",
  ],
};