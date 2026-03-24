import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const role   = searchParams.get("role");

  const where: any = {};
  if (session.user.role === "admin" && session.user.tenantId)
    where.tenantId = parseInt(session.user.tenantId);
  if (role) where.role = role;
  if (search) where.OR = [
    { username: { contains: search, mode: "insensitive" } },
    { email:    { contains: search, mode: "insensitive" } },
  ];

  const users = await prisma.user.findMany({
    where,
    select: {
      id:true, username:true, email:true, role:true,
      createdAt:true, isVerified:true,
      tenant: { select: { name:true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, email, password, role } = await req.json();
  if (!username || !email || !password)
    return NextResponse.json({ error: "username, email and password required" }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username, email, password: hash,
        role: role ?? "student",
        tenantId: session.user.tenantId ? parseInt(session.user.tenantId) : null,
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