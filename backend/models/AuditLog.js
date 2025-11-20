import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  action: { 
    type: String, 
    required: true,
    enum: ['login', 'logout', 'register', 'password_reset', 'email_verify', 'failed_login', 'token_refresh']
  },
  ip_address: { type: String },
  user_agent: { type: String },
  device_info: { type: String },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  error_message: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Index for querying logs by user and time
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ email: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
