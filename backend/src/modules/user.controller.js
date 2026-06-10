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
userRoutr.post(
  "/uploder",
  authentication,
  multerUploadhost({
    // custemPrameter: "users/profile",
    custemExtation: [...MIME_GROUPS.images],
  }).single("image"),
  us.uplode_user_image,
);

userRoutr.put(
  "/changeImage",
  authentication,
  multerUploadhost({
    // custemPrameter: "users/profile",
    custemExtation: [...MIME_GROUPS.images],
  }).single("image"),
  us.change_user_image,
);

userRoutr.delete(
  "/deleteImage",
  authentication,
    us.delete_user_image,

);

userRoutr.post("/signup", validation(vs.signupSchema), us.signup);
userRoutr.post("/login", validation(vs.loginSchema), us.login);
userRoutr.get(
  "/getuser/:id",
  authentication,
  validation(vs.getUserSchema),
  us.getOneuser,
);
userRoutr.get("/", authentication,authorization(userRole.admin), us.getUsers);
userRoutr.get("/getOneuser/:id", authentication,authorization(userRole.admin), validation(vs.idSchema), us.getOneuser);
userRoutr.post("/updateUser", authentication, us.updateUser);
userRoutr.post("/refreshToken", authentication, us.refreshToken);
userRoutr.post("/updateEmail", authentication, us.updateEmailUser);
userRoutr.delete("/deleteUser/:id", authentication,authorization(userRole.admin),validation(vs.idSchema), us.deleteUser);
userRoutr.post("/logout", authentication, us.logout);
// forget password 
// userRoutr.post("/forgetPassword", validation(vs.forgetPasswordSchema), us.forgetPassword);
// // reset password
// userRoutr.post("/resetPassword", validation(vs.resetPasswordSchema), us.resetPassword);

export default userRoutr;
