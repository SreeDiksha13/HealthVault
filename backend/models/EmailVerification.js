import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, default: Date.now, expires: 86400 } // expires in 24 hours
});

export default mongoose.model('EmailVerification', emailVerificationSchema);
