import mongoose from "mongoose";


const activitySchema = new mongoose.Schema(
{
    team:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Team",
        required:true
    },

    task:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Task"
    },


    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    action:{
        type:String,
        required:true,
        enum:[
            "task_created",
            "task_updated",
            "task_deleted",

            "status_changed",
            "priority_changed",

            "user_assigned",
            "user_unassigned",

            "comment_added",
            "comment_deleted",

            "attachment_uploaded",
            "attachment_deleted",

            "member_added",
            "member_removed",
            "join_member",

            "ownership_transferred",
            "team_created",
            "team_updated",
            "team_deleted",
            "leave",
            "role_changed"
        ]
    },


    metadata:{
        type:mongoose.Schema.Types.Mixed,
        default:{}
    }

},
{
    timestamps:true
}
);


export default mongoose.models.Activity || mongoose.model("Activity", activitySchema);