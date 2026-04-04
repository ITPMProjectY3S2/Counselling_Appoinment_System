import express from 'express';
import Feedback from '../models/Feedback.js';
import Appointment from '../models/Appointment.js';
import { protect, admin, student } from '../middleware/authMiddleware.js';

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

// @desc    Get all feedback for current student
// @route   GET /api/feedback/my-feedback
// @access  Private/Student
router.get('/my-feedback', protect, student, async (req, res) => {
    try {
        const appointments = await Appointment.find({ studentId: req.user._id }).select('_id');
        const appointmentIds = appointments.map(a => a._id);
        const feedbacks = await Feedback.find({ appointmentId: { $in: appointmentIds } });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get feedback for an appointment
// @route   GET /api/feedback/appointment/:appointmentId
// @access  Private
router.get('/appointment/:appointmentId', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ appointmentId: req.params.appointmentId });
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found for this appointment' });
        }
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private/Student
router.put('/:id', protect, student, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const feedback = await Feedback.findById(req.params.id).populate('appointmentId');

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Check if the student owns the appointment linked to the feedback
        if (String(feedback.appointmentId.studentId) !== String(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized to update this feedback' });
        }

        feedback.rating = rating || feedback.rating;
        feedback.comment = comment !== undefined ? comment : feedback.comment;

        const updatedFeedback = await feedback.save();
        res.json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Student
router.delete('/:id', protect, student, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id).populate('appointmentId');

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Check if the student owns the appointment linked to the feedback
        if (String(feedback.appointmentId.studentId) !== String(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized to delete this feedback' });
        }

        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin reply to feedback
// @route   PUT /api/feedback/:id/reply
// @access  Private/Admin
router.put('/:id/reply', protect, admin, async (req, res) => {
    try {
        const { adminReply } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.adminReply = adminReply;
        feedback.repliedAt = Date.now();

        const updatedFeedback = await feedback.save();
        res.json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all feedback (Admin)
// @route   GET /api/feedback/all
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .populate({
                path: 'appointmentId',
                select: 'date time problemType studentId counselorId',
                populate: [
                    { path: 'studentId', select: 'name email' },
                    { 
                        path: 'counselorId', 
                        populate: { path: 'userId', select: 'name' }
                    }
                ]
            });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
