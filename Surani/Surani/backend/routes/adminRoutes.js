import express from 'express';
import User from '../models/User.js';
import Counselor from '../models/Counselor.js';
import Appointment from '../models/Appointment.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all users (for admin)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all counselors (with details)
// @route   GET /api/admin/counselors
// @access  Private/Admin
router.get('/counselors', protect, admin, async (req, res) => {
    try {
        const counselors = await Counselor.find({}).populate('userId', 'name email isActive');
        res.json(counselors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a new counselor
// @route   POST /api/admin/counselors
// @access  Private/Admin
router.post('/counselors', protect, admin, async (req, res) => {
    try {
        const { name, email, password, specialty, availableDays, availableTimeSlots } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'counselor',
        });

        const counselor = await Counselor.create({
            userId: user._id,
            specialty,
            availableDays,
            availableTimeSlots,
        });

        res.status(201).json({ user, counselor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user active status (deactivate/activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                isActive: updatedUser.isActive
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCounselors = await User.countDocuments({ role: 'counselor' });
        const totalAppointments = await Appointment.countDocuments();

        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
        const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

        res.json({
            users: {
                students: totalStudents,
                counselors: totalCounselors
            },
            appointments: {
                total: totalAppointments,
                pending: pendingAppointments,
                completed: completedAppointments,
                cancelled: cancelledAppointments
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
