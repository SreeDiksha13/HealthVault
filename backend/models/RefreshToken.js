import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token_hash: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  last_used_at: { type: Date },
  device_info: { type: String },
});

export default mongoose.model('RefreshToken', refreshTokenSchema);
