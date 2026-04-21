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

// @desc    Update Counselor Availability
// @route   POST /api/counselors/availability
// @access  Private/Counselor
router.post('/availability', protect, counselor, async (req, res) => {
    try {
        const { day, times } = req.body;
        const counselorDoc = await Counselor.findOne({ userId: req.user._id });
        if (!counselorDoc) {
            return res.status(404).json({ message: 'Counselor profile not found' });
        }

        if (day && !counselorDoc.availableDays.includes(day)) {
            counselorDoc.availableDays.push(day);
        }

        if (times && Array.isArray(times)) {
            times.forEach((t) => {
                if (!counselorDoc.availableTimeSlots.includes(t)) {
                    counselorDoc.availableTimeSlots.push(t);
                }
            });
        }

        await counselorDoc.save();
        res.json({ message: 'Availability updated successfully', counselor: counselorDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Counselor Availability Slot
// @route   DELETE /api/counselors/availability
// @access  Private/Counselor
router.delete('/availability', protect, counselor, async (req, res) => {
    try {
        const timeToRemove = req.query.time || req.body.time;
        if (!timeToRemove) {
            return res.status(400).json({ message: 'Please provide a time slot to remove' });
        }

        const counselorDoc = await Counselor.findOne({ userId: req.user._id });
        if (!counselorDoc) {
            return res.status(404).json({ message: 'Counselor profile not found' });
        }

        const hasAppointment = await Appointment.findOne({
            counselorId: counselorDoc._id,
            time: timeToRemove,
            status: { $in: ['pending', 'approved'] },
        });

        if (hasAppointment) {
            return res.status(400).json({ message: 'Cannot delete: You have pending or approved appointments in this time slot.' });
        }

        counselorDoc.availableTimeSlots = counselorDoc.availableTimeSlots.filter((t) => t !== timeToRemove);
        await counselorDoc.save();

        res.json({ message: 'Availability removed successfully', counselor: counselorDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
