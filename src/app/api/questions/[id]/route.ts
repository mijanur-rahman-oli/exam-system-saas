import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id   = parseInt(params.id);
  const body = await req.json();

  const question = await prisma.question.update({
    where: { id },
    data:  { status: body.status },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id);

  // Only creator or admin can delete
  const q = await prisma.question.findUnique({ where: { id }, select: { createdBy: true } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (q.createdBy !== parseInt(session.user.id) && !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ success: true });
}