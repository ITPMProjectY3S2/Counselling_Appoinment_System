import express from 'express';
import User from '../models/User.js';
import Counselor from '../models/Counselor.js';
import Appointment from '../models/Appointment.js';
import Specialty from '../models/Specialty.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import sendWelcomeEmail from '../utils/emailService.js';

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

        // Send the welcome email with login details
        await sendWelcomeEmail(email, name, email, password);

        res.status(201).json({ user, counselor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a counselor (and user profile name)
// @route   PUT /api/admin/counselors/:id
// @access  Private/Admin
router.put('/counselors/:id', protect, admin, async (req, res) => {
    try {
        const { name, specialty } = req.body;
        const counselor = await Counselor.findById(req.params.id);
        
        if (counselor) {
            counselor.specialty = specialty || counselor.specialty;
            
            // Update associated user's name if provided
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

// @desc    Delete a counselor (and associated user)
// @route   DELETE /api/admin/counselors/:id
// @access  Private/Admin
router.delete('/counselors/:id', protect, admin, async (req, res) => {
    try {
        const counselor = await Counselor.findById(req.params.id);
        if (counselor) {
            // Delete associated user
            const user = await User.findById(counselor.userId);
            if (user) {
                await user.deleteOne();
            }
            await counselor.deleteOne();
            res.json({ message: 'Counselor and user removed' });
        } else {
            res.status(404).json({ message: 'Counselor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user active status (deactivate/activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, admin, async (req, res) => {
    try {
        const isActive = req.body.isActive;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: { isActive: isActive } }, 
            { new: true, runValidators: false }
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

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
router.get('/appointments', protect, admin, async (req, res) => {
    try {
        const appointments = await Appointment.find({})
            .populate('studentId', 'name email')
            .populate({
                path: 'counselorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ date: -1, time: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete an appointment
// @route   DELETE /api/admin/appointments/:id
// @access  Private/Admin
router.delete('/appointments/:id', protect, admin, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (appointment) {
            await appointment.deleteOne();
            res.json({ message: 'Appointment removed' });
        } else {
            res.status(404).json({ message: 'Appointment not found' });
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

// @desc    Get all specialties
// @route   GET /api/admin/specialties
// @access  Private/Admin
router.get('/specialties', protect, admin, async (req, res) => {
    try {
        const specialties = await Specialty.find({});
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a specialty
// @route   POST /api/admin/specialties
// @access  Private/Admin
router.post('/specialties', protect, admin, async (req, res) => {
    try {
        const { name, sub, desc, color, iconColor, icon } = req.body;
        const specialty = await Specialty.create({ name, sub, desc, color, iconColor, icon });
        res.status(201).json(specialty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a specialty
// @route   PUT /api/admin/specialties/:id
// @access  Private/Admin
router.put('/specialties/:id', protect, admin, async (req, res) => {
    try {
        const { name, sub, desc } = req.body;
        const specialty = await Specialty.findById(req.params.id);
        
        if (specialty) {
            specialty.name = name || specialty.name;
            specialty.sub = sub || specialty.sub;
            specialty.desc = desc || specialty.desc;
            
            const updatedSpecialty = await specialty.save();
            res.json(updatedSpecialty);
        } else {
            res.status(404).json({ message: 'Specialty not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a specialty
// @route   DELETE /api/admin/specialties/:id
// @access  Private/Admin
router.delete('/specialties/:id', protect, admin, async (req, res) => {
    try {
        const specialty = await Specialty.findById(req.params.id);
        if (specialty) {
            await specialty.deleteOne();
            res.json({ message: 'Specialty removed' });
        } else {
            res.status(404).json({ message: 'Specialty not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
