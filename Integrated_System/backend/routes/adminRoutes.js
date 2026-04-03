import express from 'express';
import User from '../models/User.js';
import Counselor from '../models/Counselor.js';
import Appointment from '../models/Appointment.js';
import Specialty from '../models/Specialty.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

const router = express.Router();

// @desc    Get all users (for admin)
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all counselors (with details)
router.get('/counselors', protect, admin, async (req, res) => {
    try {
        const counselors = await Counselor.find({}).populate('userId', 'name email isActive');
        console.log(`[TRACE-ADMIN] Found ${counselors.length} counselors`);
        res.json(counselors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a new counselor
router.post('/counselors', protect, admin, async (req, res) => {
    try {
        const { name, email, password, specialty, profileImage, availableDays, availableTimeSlots } = req.body;
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
            profileImage,
            availableDays,
            availableTimeSlots,
        });

        // Send welcome email
        await sendWelcomeEmail(email, name, email, password);

        res.status(201).json({ user, counselor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update counselor
router.put('/counselors/:id', protect, admin, async (req, res) => {
    try {
        const { name, specialty } = req.body;
        const counselor = await Counselor.findById(req.params.id);

        if (counselor) {
            if (specialty) counselor.specialty = specialty;
            if (name) {
                await User.findByIdAndUpdate(counselor.userId, { name });
            }
            const updatedCounselor = await counselor.save();
            res.json(updatedCounselor);
        } else {
            res.status(404).json({ message: 'Counselor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete counselor
router.delete('/counselors/:id', protect, admin, async (req, res) => {
    try {
        const counselor = await Counselor.findById(req.params.id);
        if (counselor) {
            await User.findByIdAndDelete(counselor.userId);
            await counselor.deleteOne();
            res.json({ message: 'Counselor and user removed' });
        } else {
            res.status(404).json({ message: 'Counselor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user status
router.put('/users/:id/status', protect, admin, async (req, res) => {
    try {
        const isActive = req.body.isActive;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: isActive } },
            { new: true }
        );

        if (updatedUser) {
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

// @desc    Get all appointments
router.get('/appointments', protect, admin, async (req, res) => {
    try {
        const appointments = await Appointment.find({})
            .populate('studentId', 'name email')
            .populate({
                path: 'counselorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        console.log(`[TRACE-ADMIN] Found ${appointments.length} appointments`);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get stats
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const students = await User.countDocuments({ role: 'student' });
        const counselors = await User.countDocuments({ role: 'counselor' });
        const appointments = await Appointment.countDocuments();
        const pending = await Appointment.countDocuments({ status: 'pending' });
        const completed = await Appointment.countDocuments({ status: 'completed' });
        const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

        res.json({
            users: { students, counselors },
            appointments: { total: appointments, pending, completed, cancelled }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Specialties CRUD
router.get('/specialties', protect, admin, async (req, res) => {
    try {
        const specialties = await Specialty.find({});
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/specialties', protect, admin, async (req, res) => {
    try {
        const specialty = await Specialty.create(req.body);
        res.status(201).json(specialty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/specialties/:id', protect, admin, async (req, res) => {
    try {
        const updated = await Specialty.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/specialties/:id', protect, admin, async (req, res) => {
    try {
        await Specialty.findByIdAndDelete(req.params.id);
        res.json({ message: 'Specialty removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
