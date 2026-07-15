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
        comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],  

    assignedTo:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

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
        secure_url: {
          type: String,
          required: true,
        },

        public_id: {
          type: String,
          required: true,
        },

        uploadedBy:{
          type: mongoose.Schema.Types.ObjectId,
          ref:"User"
        },

        createdAt:{
          type:Date,
          default:Date.now
        }
      },
    ],


    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
