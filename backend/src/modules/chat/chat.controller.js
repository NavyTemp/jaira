import { Router } from "express";
import { authentication } from "../../middleware/authentaction.js";
import { validation } from "../../middleware/vaildation.js";
import * as CS from "./chat.service.js";
import * as CV from "./chat.validation.js";

const chatRouter = Router();

chatRouter.get("/", authentication, CS.listMyChats);

chatRouter.post(
  "/direct",
  authentication,
  validation(CV.directChatSchema),
  CS.getOrCreateDirectChat,
);

chatRouter.get(
  "/:id",
  authentication,
  validation(CV.chatIdSchema),
  CS.getChatById,
);

chatRouter.get(
  "/:id/messages",
  authentication,
  validation(CV.getMessagesSchema),
  CS.getMessages,
);

chatRouter.post(
  "/:id/messages",
  authentication,
  validation(CV.sendMessageSchema),
  CS.sendMessage,
);

chatRouter.patch(
  "/:id/messages/:msgId/seen",
  authentication,
  validation(CV.seenMessageSchema),
  CS.seenMessage,
);

export default chatRouter;
