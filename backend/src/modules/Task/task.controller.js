import { Router } from "express";
import * as TS from "./task.service.js"

import { validation } from "../../middleware/vaildation.js"
import * as TSV from "./task.vaildation.js";
import { authentication } from "../../middleware/authentaction.js";

 const taskRouter = Router()
//-------------------CRUD----------------
taskRouter.post("/",validation(TSV.createTaskSchema), authentication, TS.Create_Task) 
taskRouter.get("/", authentication, TS.Get_Task) 
    







export default taskRouter
