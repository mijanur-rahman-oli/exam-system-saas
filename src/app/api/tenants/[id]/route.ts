import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: parseInt(params.id) },
    include: { _count: { select: { users:true, courses:true, exams:true } } },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tenant);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body   = await req.json();
  const tenant = await prisma.tenant.update({
    where: { id: parseInt(params.id) },
    data:  { isActive: body.isActive },
  });
  return NextResponse.json(tenant);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.tenant.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}