import { z } from "zod";
import { egyptPhoneRegex, passwordRegex } from "../utlis/genralRules.js";
import { userGender, userRole, userStatus } from "../utlis/genral_emun.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const signupSchema = {
  body: z
    .object({
      name: z
        .string({ required_error: "name is required" })
        .trim()
        .min(3, "name must be at least 3 characters"),

      email: z
        .string({ required_error: "email is required" })
        .email("invalid email"),

      password: z
        .string({ required_error: "password is required" })
        .regex(passwordRegex, "invalid password format")
        .min(8, "password must be at least 8 characters"),

      confirmpassword: z.string({
        required_error: "confirm password is required",
      }),

      phone: z
        .string({ required_error: "phone is required" })
        .regex(egyptPhoneRegex, "invalid egyptian phone number"),

      gender: z
        .enum([userGender.male, userGender.female])
        .default(userGender.male)
        .optional(),

      age: z
        .coerce.number()
        .min(15, "age must be at least 15 years old")
        .max(100, "age must be less than 100 years old"),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmpassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmpassword"],
        });
      }
    }),
};

export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: "email is required" })
      .email("invalid email format")
      .trim(),

    password: z
      .string({ required_error: "password is required" })
      .min(6, "password must be at least 6 characters"),
  }),
};

export const idSchema = {
  params: z.object({
    id: objectId,
  }),
};

export const updateUserSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "name must be at least 3 characters")
      .optional(),

    phone: z
      .string()
      .regex(egyptPhoneRegex, "invalid egyptian phone number")
      .optional(),

    age: z
      .coerce.number()
      .min(15, "age must be at least 15 years old")
      .max(100, "age must be less than 100 years old")
      .optional(),

    gender: z.enum([userGender.male, userGender.female]).optional(),
  }),
};

export const updateEmailSchema = {
  body: z.object({
    newEmail: z
      .string({ required_error: "new email is required" })
      .email("invalid email format")
      .trim(),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    oldPassword: z
      .string({ required_error: "old password is required" })
      .min(6, "old password must be at least 6 characters"),

    newPassword: z
      .string({ required_error: "new password is required" })
      .regex(passwordRegex, "invalid password format")
      .min(8, "new password must be at least 8 characters"),
  }),
};

export const verifyEmailSchema = {
  body: z.object({
    email: z
      .string({ required_error: "email is required" })
      .email("invalid email format")
      .trim(),

    otp: z
      .string({ required_error: "otp is required" })
      .length(6, "otp must be 6 digits"),
  }),
};

export const forgetPasswordSchema = {
  body: z.object({
    email: z
      .string({ required_error: "email is required" })
      .email("invalid email format")
      .trim(),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      email: z
        .string({ required_error: "email is required" })
        .email("invalid email format")
        .trim(),

      otp: z
        .string({ required_error: "otp is required" })
        .length(6, "otp must be 6 digits"),

      newPassword: z
        .string({ required_error: "new password is required" })
        .regex(passwordRegex, "invalid password format")
        .min(8, "new password must be at least 8 characters"),

      confirmPassword: z.string({
        required_error: "confirm password is required",
      }),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};

export const resendOtpSchema = {
  body: z.object({
    email: z
      .string({ required_error: "email is required" })
      .email("invalid email format")
      .trim(),

    purpose: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"], {
      required_error: "purpose is required",
    }),
  }),
};
