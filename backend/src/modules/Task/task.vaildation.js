import { z } from "zod";

export const taskStatus = z.enum(["todo", "in_progress", "review", "done"]);
export const taskPriority = z.enum(["low", "medium", "high", "urgent"]);

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createTaskSchema = {
  body: z.object({
    title: z
      .string({ required_error: "task title is required" })
      .trim()
      .min(2, "task title must be at least 2 characters")
      .max(200, "task title must be under 200 characters"),

    description: z
      .string()
      .trim()
      .max(2000, "description must be under 2000 characters")
      .optional(),

    dueDate: z.coerce.date().optional(),

    priority: taskPriority.optional(),

    team: objectId.optional(),

    assignedTo: z.array(objectId).optional().default([]),

    tags: z.array(z.string().trim()).optional(),
  }),
};

export const taskIdSchema = {
  params: z.object({
    id: objectId,
  }),
};

export const listTasksSchema = {
  query: z.object({
    status: taskStatus.optional(),
    priority: taskPriority.optional(),
    team: objectId.optional(),
    assignedTo: objectId.optional(),
    dueBefore: z.coerce.date().optional(),
    dueAfter: z.coerce.date().optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
  }),
};

export const updateTaskSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(2, "title must be at least 2 characters")
      .max(200, "title must be under 200 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "description must be under 2000 characters")
      .optional(),

    dueDate: z.coerce.date().optional(),

    priority: taskPriority.optional(),

    tags: z.array(z.string().trim()).optional(),
  }),
};

export const updateTaskStatusSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    status: taskStatus,
  }),
};

export const assignTaskSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    assignedTo: z.array(objectId).default([]),
  }),
};

export const addCommentSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    text: z
      .string({ required_error: "text is required" })
      .trim()
      .min(1, "comment cannot be empty")
      .max(2000, "comment must be under 2000 characters"),
  }),
};

export const updateCommentSchema = {
  params: z.object({
    id: objectId,
    commentId: objectId,
  }),
  body: z.object({
    text: z
      .string({ required_error: "text is required" })
      .trim()
      .min(1, "comment cannot be empty")
      .max(2000, "comment must be under 2000 characters"),
  }),
};

export const commentIdSchema = {
  params: z.object({
    id: objectId,
    commentId: objectId,
  }),
};

export const deleteAttachmentSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    public_id: z.string({ required_error: "public_id is required" }),
  }),
};
