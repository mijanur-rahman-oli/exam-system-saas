import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all users in a tenant
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { tenantId: parseInt(params.id) },
    select: {
      id: true, username: true, email: true, role: true,
      createdAt: true, isVerified: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

// POST create user in tenant
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, email, password, role } = await req.json();
  if (!username || !email || !password)
    return NextResponse.json({ error: "username, email and password required" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const allowedRoles = ["admin","question_setter","student"];
  if (role && !allowedRoles.includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hash,
        role: role ?? "student",
        tenantId: parseInt(params.id),
        isVerified: true,
      },
      select: { id:true, username:true, email:true, role:true, createdAt:true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}