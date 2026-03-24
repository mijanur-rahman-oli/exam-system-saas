import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.slug },
      select: { id:true, isActive:true, name:true },
    });
    if (!tenant)
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    if (!tenant.isActive)
      return NextResponse.json({ error: "This portal is currently inactive" }, { status: 403 });

    // Check duplicates
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing)
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username, email, password: hash,
        role: "student",
        tenantId: tenant.id,
        isVerified: true,
      },
      select: { id:true, username:true, email:true, role:true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Username or email already taken" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}