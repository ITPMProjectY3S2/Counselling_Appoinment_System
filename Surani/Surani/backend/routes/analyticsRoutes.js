import express from 'express';
import User from '../models/User.js';
import Counselor from '../models/Counselor.js';
import Appointment from '../models/Appointment.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCounselors = await Counselor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

        res.json({
            totalUsers,
            totalCounselors,
            totalAppointments,
            pendingAppointments,
            completedAppointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;