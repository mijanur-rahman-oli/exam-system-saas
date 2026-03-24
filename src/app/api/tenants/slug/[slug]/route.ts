import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.slug },
      select: { id:true, name:true, slug:true, logoUrl:true, isActive:true },
    });
    if (!tenant || !tenant.isActive)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}