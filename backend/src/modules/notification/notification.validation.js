import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const notificationIdSchema = {
  params: z.object({
    id: objectId,
  }),
};

export const listNotificationsSchema = {
  query: z.object({
    unread: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
  }),
};
