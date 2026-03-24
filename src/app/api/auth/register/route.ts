import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/register
// Public — called from /register/[slug] page
export async function POST(req: Request) {
  try {
    const { username, email, password, tenantId } = await req.json();

    if (!username?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: "username, email and password are required" }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    // tenantId is required for self-registration
    if (!tenantId)
      return NextResponse.json(
        { error: "Invalid registration link. Please use the link provided by your coaching center." },
        { status: 400 }
      );

    const tid = parseInt(tenantId);
    if (isNaN(tid))
      return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where:  { id: tid },
      select: { id: true, isActive: true },
    });
    if (!tenant)
      return NextResponse.json({ error: "Coaching center not found" }, { status: 404 });
    if (!tenant.isActive)
      return NextResponse.json({ error: "This coaching center is currently inactive" }, { status: 403 });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username:   username.trim(),
        email:      email.trim().toLowerCase(),
        password:   hash,
        role:       "student",
        tenantId:   tid,
        isVerified: false,
      },
      select: { id: true, username: true, email: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    console.error("Register error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}