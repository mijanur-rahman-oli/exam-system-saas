import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = parseInt(params.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true, role: true,
      isVerified: true, createdAt: true,
      tenant: { select: { id: true, name: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin can only view users in their own tenant
  if (session.user.role === "admin") {
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
    if (user.tenant?.id !== tenantId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = parseInt(params.id);
  const body   = await req.json();

  // Fetch the target user to check tenant
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true, role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "admin") {
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
    if (target.tenantId !== tenantId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Admins cannot promote to super_admin
    if (body.role === "super_admin")
      return NextResponse.json({ error: "Cannot assign super_admin role" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      role:       body.role,
      isVerified: body.isVerified,
    },
    select: { id: true, username: true, email: true, role: true, isVerified: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);

  // Prevent self-delete
  if (id === parseInt(session.user.id))
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  // Tenant guard
  if (session.user.role === "admin") {
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
    const target   = await prisma.user.findUnique({ where: { id }, select: { tenantId: true } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (target.tenantId !== tenantId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}