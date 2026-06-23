
import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
  },
  expireAt: {
   type: Date,
    required: true,
    index: { expires: 0 },
  }
}, { timestamps: true });

const RevokedTokenModel = mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);

export default RevokedTokenModel;
