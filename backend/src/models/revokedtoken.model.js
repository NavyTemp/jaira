
import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
  },
  expireAt: {
   type: String,
    required: true,
  }
}, { timestamps: true });

const RevokedTokenModel = mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);

export default RevokedTokenModel;
