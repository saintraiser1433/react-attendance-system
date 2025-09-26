import { prisma } from "./db";
import { Role } from "@prisma/client";

export async function createAuditLog(params: {
  actorUserId: string;
  actorRole: Role;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}) {
  return await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}

export async function createNotification(params: {
  userId?: string;
  title: string;
  body: string;
}) {
  return await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
    },
  });
}
