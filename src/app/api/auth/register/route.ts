import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing)
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });

    // Auto-assign to the first active tenant (if only one) or no tenant
    const defaultTenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hash,
        role: "student",
        tenantId: defaultTenant?.id ?? null,
        isVerified: true,
      },
      select: { id:true, username:true, email:true, role:true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    console.error("Register error:", e);
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Username or email already taken" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}