import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { userId: (session as any).user?.id },
        { userId: null }, // Global notifications
      ],
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId, markRead } = body;

  if (!notificationId) {
    return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
  }

  const notification = await prisma.notification.update({
    where: { 
      id: notificationId,
      OR: [
        { userId: (session as any).user?.id },
        { userId: null },
      ],
    },
    data: {
      readAt: markRead ? new Date() : null,
    },
  });

  return NextResponse.json(notification);
}
