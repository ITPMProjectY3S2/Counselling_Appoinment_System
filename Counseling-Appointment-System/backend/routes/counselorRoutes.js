import express from 'express';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import User from '../models/User.js';
import { protect, counselor, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all public counselors (for students to book)
// @route   GET /api/counselors
// @access  Public or Private/Student
router.get('/', protect, async (req, res) => {
    try {
        // Find active counselors
        const activeUsers = await User.find({ role: 'counselor', isActive: true }).select('_id');
        const activeUserIds = activeUsers.map(u => u._id);

        const counselors = await Counselor.find({ userId: { $in: activeUserIds } }).populate('userId', 'name email');
        res.json(counselors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
