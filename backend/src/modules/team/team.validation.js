import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createTeamSchema = {
  body: z.object({
    name: z
      .string({ required_error: "team name is required" })
      .trim()
      .min(2, "team name must be at least 2 characters"),

    description: z.string().trim().optional(),

    membersId: z
      .array(objectId, { required_error: "membersId is required" })
      .min(1, "at least one member is required"),

    tasksId: z.array(objectId).optional().default([]),

    chatId: objectId.optional(),
  }),
};

export const teamIdSchema = {
  params: z.object({
    id: objectId,
  }),
};

export const updateTeamSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().trim().min(2, "team name must be at least 2 characters").optional(),
    description: z.string().trim().optional(),
  }),
};

export const addMemberSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    userId: objectId,
    role: z.enum(["member", "admin"]).default("member").optional(),
  }),
};

export const removeMemberSchema = {
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
};

export const changeMemberRoleSchema = {
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
  body: z.object({
    role: z.enum(["member", "admin"], { required_error: "role is required" }),
  }),
};

export const transferOwnershipSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    userId: objectId,
  }),
};
