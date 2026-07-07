import { z } from "zod";
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
export const createTaskSchema = {
  body: z.object({
    title: z
      .string({ required_error: "task name is required" })
      .trim()
      .min(2, "task name must be at least 2 characters")
      .max(50, "task name must be under 50 characters"),

    description: z
      .string()
      .trim()
      .min(2, "description must be at least 2 characters")
      .max(500, "description must be under 500 characters")
      .optional(),

    dueDate: z.string().datetime().optional(),

    assignedTo: z
      .array(objectId, { required_error: "assignedTo is required" })
      .optional()
      .default([]),

    createdBy: objectId.optional(),
    chat: objectId.optional(),
    team: objectId.optional(),
    status: z
      .enum(["pending", "inProgress", "review", "done"])
      .default("pending"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),

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
