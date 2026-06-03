import { Router } from "express";
import { authentication } from "../middleware/authentaction.js";
import { validation } from "../middleware/vaildation.js";

import * as us from "./user.service.js";
import* as vs from "./user.vaildation.js";

const userRoutr=Router()
userRoutr.post("/signup",validation(vs.signupSchema),us.signup)
userRoutr.post("/login" , validation(vs.loginSchema),us.login)
userRoutr.get("/getuser/:id",authentication,validation(vs.getUserSchema), us.getOneuser)
userRoutr.get("/getusers",authentication, us.getUsers)
userRoutr.post("/upDateOneuser",authentication, us.updateUser)
userRoutr.post("/refreshToken",authentication, us.refreshToken)
userRoutr.post("/upEmail",authentication, us.updateEmailUser)
userRoutr.delete("/deleteuser",authentication, us.deleteUser)
userRoutr.post("/logout",authentication, us.logout)

export default userRoutr