import express from 'express';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import { protect, counselor, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create new appointment (Student)
// @route   POST /api/appointments
// @access  Private/Student
router.post('/', protect, student, async (req, res) => {
    try {
        const { counselorId, date, time, problemType } = req.body;

        // Check if counseling session already exists for this time
        const existingAppointment = await Appointment.findOne({ counselorId, date, time, status: { $in: ['pending', 'approved'] } });
        if (existingAppointment) {
            return res.status(400).json({ message: 'Timeslot is already booked or pending' });
        }

        const appointment = new Appointment({
            studentId: req.user._id,
            counselorId,
            date,
            time,
            problemType,
        });

        const createdAppointment = await appointment.save();
        res.status(201).json(createdAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get logged in user appointments (Student or Counselor)
// @route   GET /api/appointments/myappointments
// @access  Private
router.get('/myappointments', protect, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const appointments = await Appointment.find({ studentId: req.user._id })
                .populate({
                    path: 'counselorId',
                    populate: { path: 'userId', select: 'name email' }
                })
                .sort({ date: -1 });
            res.json(appointments);
        } else if (req.user.role === 'counselor') {
            const counselorProfile = await Counselor.findOne({ userId: req.user._id });
            if (!counselorProfile) {
                return res.status(404).json({ message: 'Counselor profile not found' });
            }
            const appointments = await Appointment.find({ counselorId: counselorProfile._id })
                .populate('studentId', 'name email')
                .sort({ date: -1 });
            res.json(appointments);
        } else {
            res.status(401).json({ message: 'Not authorized for appointments' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update appointment status (Counselor)
// @route   PUT /api/appointments/:id/status
// @access  Private/Counselor
router.put('/:id/status', protect, counselor, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (appointment) {
            // Basic auth check to make sure counselor owns this appointment
            const counselorProfile = await Counselor.findOne({ userId: req.user._id });
            if (req.user.role !== 'admin' && String(appointment.counselorId) !== String(counselorProfile._id)) {
                return res.status(401).json({ message: 'Not authorized to update this appointment' });
            }

            appointment.status = status;
            if (status === 'rejected' && rejectionReason) {
                appointment.rejectionReason = rejectionReason;
            }
            const updatedAppointment = await appointment.save();
            res.json(updatedAppointment);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Cancel appointment (Student)
// @route   PUT /api/appointments/:id/cancel
// @access  Private/Student
router.put('/:id/cancel', protect, student, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (appointment) {
            if (String(appointment.studentId) !== String(req.user._id)) {
                return res.status(401).json({ message: 'Not authorized to cancel this appointment' });
            }

            if (appointment.status === 'completed' || appointment.status === 'rejected') {
                return res.status(400).json({ message: 'Cannot cancel a completed or rejected appointment' });
            }

            appointment.status = 'cancelled';
            const updatedAppointment = await appointment.save();
            res.json(updatedAppointment);

        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
