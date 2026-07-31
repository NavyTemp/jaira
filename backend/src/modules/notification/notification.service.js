import NotificationModel from "../../models/notification.model.js";
import { emitToUser } from "../../sockets/socket.js";

/**
 * Create one notification and push it in real time to the recipient's
 * personal socket room (`user:<id>` -> `notification:new`).
 */
export const createNotification = async ({
  user,
  message,
  type = "task",
  relatedId,
}) => {
  if (!user) return null;
  const notification = await NotificationModel.create({
    user,
    message,
    type,
    relatedId,
  });
  emitToUser(user, "notification:new", notification);
  return notification;
};

/**
 * Fan-out helper: create the same notification for many recipients at once
 * (e.g. a team-wide event). De-dupes ids and skips an optional `exclude` user
 * (usually the actor who triggered the event).
 */
export const createNotifications = async (
  recipients = [],
  { message, type = "task", relatedId, exclude } = {},
) => {
  const excludeId = exclude ? exclude.toString() : null;
  const unique = [
    ...new Set(recipients.map((r) => r?.toString()).filter(Boolean)),
  ].filter((id) => id !== excludeId);

  if (unique.length === 0) return [];

  const docs = await NotificationModel.insertMany(
    unique.map((user) => ({ user, message, type, relatedId })),
  );

  docs.forEach((n) => emitToUser(n.user, "notification:new", n));
  return docs;
};

// ─── REST handlers ───────────────────────────────────────

export const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const filter = { user: req.user._id };
    if (req.query.unread === "true") filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      message: "notifications fetched",
      notifications,
      unreadCount,
      page,
      limit,
      total,
    });
  } catch (error) {
    return next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "notification not found" });
    }
    return res.status(200).json({ message: "notification read", notification });
  } catch (error) {
    return next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await NotificationModel.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true },
    );
    return res.status(200).json({ message: "all notifications read" });
  } catch (error) {
    return next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "notification not found" });
    }
    return res.status(200).json({ message: "notification deleted" });
  } catch (error) {
    return next(error);
  }
};
