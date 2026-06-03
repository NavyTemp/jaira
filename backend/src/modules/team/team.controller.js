import { Router } from "express";
import { authentication } from "../../middleware/authentaction.js";
import * as TS from "./team.service.js";

const teamRouter = Router();
teamRouter.post("/createTeam", authentication, TS.createTeam);
export default teamRouter;