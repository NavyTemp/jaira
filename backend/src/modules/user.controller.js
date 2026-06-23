import { Router } from "express";
import { authentication } from "../middleware/authentaction.js";
import { validation } from "../middleware/vaildation.js";
import * as us from "./user.service.js";
import * as vs from "./user.vaildation.js";
import { multerUploadhost } from "../middleware/multer.js";
import { MIME_GROUPS } from "../utlis/genralFileEx.js";
import { authorization } from "../middleware/authoritation.js";
import { userRole } from "../utlis/genral_emun.js";

const userRoutr = Router();

// ─── AUTH (public) ───────────────────────────────────────
userRoutr.post("/signup", validation(vs.signupSchema), us.signup);
userRoutr.post("/login", validation(vs.loginSchema), us.login);
userRoutr.post("/verify-email", validation(vs.verifyEmailSchema), us.verifyEmail);
userRoutr.post("/forget-password", validation(vs.forgetPasswordSchema), us.forgetPassword);
userRoutr.post("/reset-password", validation(vs.resetPasswordSchema), us.resetPassword);
userRoutr.post("/resend-otp", validation(vs.resendOtpSchema), us.resendOtp);

// ─── AUTH (protected) ────────────────────────────────────
userRoutr.post("/logout", authentication, us.logout);
userRoutr.post("/refresh-token", authentication, us.refreshToken);

// ─── PROFILE (self) ──────────────────────────────────────
userRoutr.get("/me", authentication, us.getMe);
userRoutr.patch("/me", authentication, validation(vs.updateUserSchema), us.updateUser);
userRoutr.patch("/me/email", authentication, validation(vs.updateEmailSchema), us.updateEmailUser);
userRoutr.patch("/me/password", authentication, validation(vs.changePasswordSchema), us.changePassword);
userRoutr.delete("/me", authentication, us.deleteMe);

// ─── PROFILE IMAGE ───────────────────────────────────────
userRoutr.post(
  "/me/image",
  authentication,
  multerUploadhost({ custemExtation: [...MIME_GROUPS.images] }).single("image"),
  us.uplode_user_image,
);
userRoutr.put(
  "/me/image",
  authentication,
  multerUploadhost({ custemExtation: [...MIME_GROUPS.images] }).single("image"),
  us.change_user_image,
);
userRoutr.delete("/me/image", authentication, us.delete_user_image);
userRoutr.get("/me/image", authentication, us.get_user_image);

// ─── ADMIN ───────────────────────────────────────────────
userRoutr.get("/", authentication, authorization([userRole.admin]), us.getUsers);
userRoutr.get("/:id", authentication, authorization([userRole.admin]), validation(vs.idSchema), us.getOneuser);
userRoutr.delete("/:id", authentication, authorization([userRole.admin]), validation(vs.idSchema), us.deleteUser);

export default userRoutr;
