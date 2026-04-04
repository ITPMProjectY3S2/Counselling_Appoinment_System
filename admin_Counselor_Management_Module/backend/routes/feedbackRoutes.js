import express from 'express';
import Feedback from '../models/Feedback.js';
import Appointment from '../models/Appointment.js';
import { protect, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Submit feedback for an appointment
// @route   POST /api/feedback
// @access  Private/Student
router.post('/', protect, student, async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (String(appointment.studentId) !== String(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized for this appointment feedback' });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({ message: 'Can only submit feedback for completed appointments' });
        }

        const existingFeedback = await Feedback.findOne({ appointmentId });
        if (existingFeedback) {
            return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
        }

        const feedback = new Feedback({
            appointmentId,
            rating,
            comment
        });

        const createdFeedback = await feedback.save();
        res.status(201).json(createdFeedback);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get feedback for an appointment
// @route   GET /api/feedback/:appointmentId
// @access  Private
router.get('/:appointmentId', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ appointmentId: req.params.appointmentId });
        if (feedback) {
            res.json(feedback);
        } else {
            res.status(404).json({ message: 'Feedback not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
