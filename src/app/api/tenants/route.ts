import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: { select: { users: true, courses: true, exams: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tenants);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug } = await req.json();
  if (!name || !slug)
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  try {
    const tenant = await prisma.tenant.create({ data: { name, slug } });
    return NextResponse.json(tenant, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Name or slug already exists" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}