import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, default: Date.now, expires: 3600 } // expires in 1 hour
});

export default mongoose.model('PasswordReset', passwordResetSchema);
