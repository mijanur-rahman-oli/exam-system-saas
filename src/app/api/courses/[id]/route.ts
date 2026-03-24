import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const course = await prisma.course.update({
    where: { id: parseInt(params.id) },
    data: { name: body.name, description: body.description, isActive: body.isActive },
  });
  return NextResponse.json(course);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.course.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}