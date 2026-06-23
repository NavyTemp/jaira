import { Router } from "express";
import { authentication } from "../../middleware/authentaction.js";
import { validation } from "../../middleware/vaildation.js";
import { multerUploadhost } from "../../middleware/multer.js";
import { MIME_GROUPS } from "../../utlis/genralFileEx.js";
import * as TS from "./team.service.js";
import * as TV from "./team.validation.js";

const teamRouter = Router();

// ─── CRUD ────────────────────────────────────────────────
teamRouter.post("/", authentication, validation(TV.createTeamSchema), TS.createTeam);
teamRouter.get("/", authentication, TS.getTeams);
teamRouter.get("/:id", authentication, validation(TV.teamIdSchema), TS.getTeamById);
teamRouter.patch("/:id", authentication, validation(TV.updateTeamSchema), TS.updateTeam);
teamRouter.delete("/:id", authentication, validation(TV.teamIdSchema), TS.deleteTeam);

// ─── MEMBERS ─────────────────────────────────────────────
teamRouter.post("/:id/members", authentication, validation(TV.addMemberSchema), TS.addMember);
teamRouter.delete("/:id/members/:userId", authentication, validation(TV.removeMemberSchema), TS.removeMember);
teamRouter.patch("/:id/members/:userId/role", authentication, validation(TV.changeMemberRoleSchema), TS.changeMemberRole);
teamRouter.post("/:id/leave", authentication, validation(TV.teamIdSchema), TS.leaveTeam);
teamRouter.patch("/:id/transfer", authentication, validation(TV.transferOwnershipSchema), TS.transferOwnership);

// ─── IMAGE ───────────────────────────────────────────────
teamRouter.post(
  "/:id/image",
  authentication,
  validation(TV.teamIdSchema),
  multerUploadhost({ custemExtation: [...MIME_GROUPS.images] }).single("image"),
  TS.uploadTeamImage,
);

teamRouter.put(
  "/:id/image",
  authentication,
  validation(TV.teamIdSchema),
  multerUploadhost({ custemExtation: [...MIME_GROUPS.images] }).single("image"),
  TS.changeTeamImage,
);

teamRouter.delete(
  "/:id/image",
  authentication,
  validation(TV.teamIdSchema),
  TS.deleteTeamImage,
);

export default teamRouter;
