import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: { type: String, required: true },

    type: {
      type: String,
      enum: ["task", "team", "chat", "system"],
      default: "task",
    },

    isRead: { type: Boolean, default: false },

    relatedId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);