import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyUserInTenant(userId: number, tenantId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, role: true },
  });
  if (!user) return { error: "User not found", status: 404 };
  if (user.tenantId !== tenantId) return { error: "User not in this tenant", status: 400 };
  return { user };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId   = parseInt(params.userId);
  const tenantId = parseInt(params.id);
  const check    = await verifyUserInTenant(userId, tenantId);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true, role: true,
      isVerified: true, createdAt: true, tenantId: true,
    },
  });
  return NextResponse.json(user);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId   = parseInt(params.userId);
  const tenantId = parseInt(params.id);
  const check    = await verifyUserInTenant(userId, tenantId);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json();
  const allowedRoles = ["admin", "question_setter", "student"];
  if (body.role && !allowedRoles.includes(body.role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.role       !== undefined && { role: body.role }),
      ...(body.isVerified !== undefined && { isVerified: body.isVerified }),
    },
    select: { id: true, username: true, email: true, role: true, isVerified: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId   = parseInt(params.userId);
  const tenantId = parseInt(params.id);

  // ?mode=detach → keep account, remove from tenant
  // ?mode=delete (default) → permanently delete user and all their data
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "delete";

  const check = await verifyUserInTenant(userId, tenantId);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  if (mode === "detach") {
    await prisma.user.update({
      where: { id: userId },
      data:  { tenantId: null },
    });
    return NextResponse.json({ success: true, action: "detached" });
  }

  // Hard delete — Prisma cascade removes enrollments, exam attempts, answers
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true, action: "deleted" });
}