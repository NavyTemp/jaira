import { Router } from "express";
import { authentication } from "../../middleware/authentaction.js";
import { validation } from "../../middleware/vaildation.js";
import * as NS from "./notification.service.js";
import * as NV from "./notification.validation.js";

const notificationRouter = Router();

notificationRouter.get(
  "/",
  authentication,
  validation(NV.listNotificationsSchema),
  NS.listNotifications,
);

notificationRouter.patch("/read-all", authentication, NS.markAllRead);

notificationRouter.patch(
  "/:id/read",
  authentication,
  validation(NV.notificationIdSchema),
  NS.markRead,
);

notificationRouter.delete(
  "/:id",
  authentication,
  validation(NV.notificationIdSchema),
  NS.deleteNotification,
);

export default notificationRouter;
