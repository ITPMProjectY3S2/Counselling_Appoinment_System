import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Counselor', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['active', 'notified'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Waitlist', waitlistSchema);
