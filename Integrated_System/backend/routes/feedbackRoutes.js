import express from 'express';
import Feedback from '../models/Feedback.js';
import Appointment from '../models/Appointment.js';
import { protect, student, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all feedback (for admin)
// @route   GET /api/feedback
router.get('/', protect, admin, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .populate('studentId', 'name email')
            .populate({
                path: 'counselorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin reply to feedback
// @route   PUT /api/feedback/:id/reply
router.put('/:id/reply', protect, admin, async (req, res) => {
    try {
        const { reply } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        feedback.adminReply = reply;
        feedback.adminReplyDate = Date.now();

        const updatedFeedback = await feedback.save();
        res.json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add feedback
// @route   POST /api/feedback
router.post('/', protect, student, async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;
        const appt = await Appointment.findById(appointmentId);

        if (!appt) return res.status(404).json({ message: 'Appointment not found' });
        if (String(appt.studentId) !== String(req.user._id)) return res.status(401).json({ message: 'Unauthorized' });

        const feedback = await Feedback.create({
            appointmentId,
            studentId: req.user._id,
            counselorId: appt.counselorId,
            rating,
            comment,
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get feedback for counselor
router.get('/counselor/:id', protect, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ counselorId: req.params.id }).populate('studentId', 'name');
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my feedbacks (as student)
router.get('/myfeedbacks', protect, student, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ studentId: req.user._id }).populate('counselorId', 'userId');
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update feedback
router.put('/:id', protect, student, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        if (String(feedback.studentId) !== String(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized to edit this feedback' });
        }

        feedback.rating = rating || feedback.rating;
        feedback.comment = comment || feedback.comment;

        const updatedFeedback = await feedback.save();
        res.json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete feedback
router.delete('/:id', protect, student, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        if (String(feedback.studentId) !== String(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized to delete this feedback' });
        }

        await feedback.deleteOne();
        res.json({ message: 'Feedback removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
