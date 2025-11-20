import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  full_name: { type: String },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  email_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
