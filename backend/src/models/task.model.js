import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: String,

    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    dueDate: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      
      ref: "Chat",
    },

    attachments: [
      {
        url: String,
        type: String,
      },
    ],

    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
