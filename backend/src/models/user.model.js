import mongoose from "mongoose";

import { userGender, userRole, userStatus} from "../utlis/genral_emun.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,

  },
  password: {
    type: String,
    required: true,
  },
  image: {
    secure_url:{type :String},
    public_id:{type :String}
      
  
  },

  phone:{
    type: String,
    required: true
  },
  role:{
    type: String,
    enum: Object.values(userRole),
    default: userRole.user

  },
  gender:{
    type: String,
    enum: Object.values(userGender),
    default: userGender.male
  },
  status: {
    type: String,
    enum: Object.values(userStatus),
    default: userStatus.inactive
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   
  },
 
  age:{
    type: Number,
    required: true,
    min:[10,"age must be greater than 10"],
    max:[100,"age must be less than 100"]
  },
confirm:{
  type: Boolean,
  default: false
},
teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
},
{
  timestamps: true
}
);

 const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
 export default UserModel