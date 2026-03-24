import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subject = await prisma.subject.findUnique({
    where: { id: parseInt(params.id) },
    include: { _count: { select: { questions: true, exams: true } } },
  });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subject);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  try {
    const subject = await prisma.subject.update({
      where: { id: parseInt(params.id) },
      data: { name, description },
    });
    return NextResponse.json(subject);
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Subject name already exists" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  const isSuperAdmin = session.user.role === "super_admin";
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;

  // Admin can only delete their own tenant's subjects
  if (!isSuperAdmin) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (subject.tenantId !== tenantId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2003")
      return NextResponse.json({ error: "Subject is in use and cannot be deleted" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}