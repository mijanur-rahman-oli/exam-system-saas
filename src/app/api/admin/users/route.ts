import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const role   = searchParams.get("role");

  const where: Record<string, any> = {};

  // Admin can only see users in their own tenant
  if (session.user.role === "admin") {
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : -1;
    where.tenantId = tenantId;
  }
  // super_admin can optionally filter by tenant
  const filterTenantId = searchParams.get("tenantId");
  if (session.user.role === "super_admin" && filterTenantId) {
    where.tenantId = parseInt(filterTenantId);
  }

  if (role) where.role = role;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { email:    { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id:         true,
      username:   true,
      email:      true,
      role:       true,
      isVerified: true,
      createdAt:  true,
      tenant:     { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, email, password, role, tenantId: bodyTenantId } = await req.json();
  if (!username?.trim() || !email?.trim() || !password)
    return NextResponse.json({ error: "username, email, and password are required" }, { status: 400 });

  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  // Admins can only create users in their own tenant and cannot create super_admins
  const isSuperAdmin = session.user.role === "super_admin";
  const tenantId = isSuperAdmin && bodyTenantId
    ? parseInt(bodyTenantId)
    : session.user.tenantId
      ? parseInt(session.user.tenantId)
      : null;

  const allowedRoles = isSuperAdmin
    ? ["student", "question_setter", "admin", "super_admin"]
    : ["student", "question_setter", "admin"];

  if (role && !allowedRoles.includes(role))
    return NextResponse.json({ error: `Role must be one of: ${allowedRoles.join(", ")}` }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username:   username.trim(),
        email:      email.trim().toLowerCase(),
        password:   hash,
        role:       role ?? "student",
        tenantId,
        isVerified: true,
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    console.error("POST /api/admin/users error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}