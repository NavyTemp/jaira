import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const chatIdSchema = {
  params: z.object({
    id: objectId,
  }),
};

export const directChatSchema = {
  body: z.object({
    userId: objectId,
  }),
};

export const getMessagesSchema = {
  params: z.object({
    id: objectId,
  }),
  query: z.object({
    before: objectId.optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
  }),
};

export const sendMessageSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    text: z.string().trim().max(4000).optional(),
    attachments: z
      .array(
        z.object({
          url: z.string().url(),
          type: z.string().optional(),
        }),
      )
      .optional(),
  }),
};

export const seenMessageSchema = {
  params: z.object({
    id: objectId,
    msgId: objectId,
  }),
};
