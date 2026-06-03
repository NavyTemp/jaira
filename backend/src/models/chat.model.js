import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["team", "task", "direct"],
      required: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);