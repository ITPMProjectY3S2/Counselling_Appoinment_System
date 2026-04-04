import express from 'express';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import User from '../models/User.js';
import Waitlist from '../models/Waitlist.js';
import Notification from '../models/Notification.js';
import { protect, counselor, student } from '../middleware/authMiddleware.js';
import sendEmail from '../utils/emailService.js';

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

        // Notify Student
        await Notification.create({
            userId: req.user._id,
            title: 'Booking Request Submitted',
            message: `Your booking request for ${date} at ${time} has been sent successfully.`,
            type: 'info'
        });
        
        // Notify Counselor - need Counselor's userId
        const counselorObj = await Counselor.findById(counselorId);
        if (counselorObj) {
            await Notification.create({
                userId: counselorObj.userId,
                title: 'New Booking Request',
                message: `You have a new booking request for ${date} at ${time}.`,
                type: 'info'
            });
        }

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

            // Notify Student
            await Notification.create({
                userId: appointment.studentId,
                title: `Appointment ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                message: `Your appointment on ${appointment.date} at ${appointment.time} has been ${status}.${status === 'rejected' ? ` Reason: ${rejectionReason}` : ''}`,
                type: status === 'approved' ? 'success' : 'error'
            });

            // Email Notification on Approval
            if (status === 'approved') {
                const studentUser = await User.findById(appointment.studentId);
                if (studentUser && studentUser.email) {
                    await sendEmail({
                        to: studentUser.email,
                        subject: 'Counseling Appointment Approved',
                        text: `Your counseling appointment on ${appointment.date} at ${appointment.time} has been officially approved.\n\nPlease log in to the dashboard to manage your sessions.`
                    });
                }
            }

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

            // Notify Counselor
            const counselorObj = await Counselor.findById(appointment.counselorId);
            if (counselorObj) {
                await Notification.create({
                    userId: counselorObj.userId,
                    title: 'Appointment Cancelled',
                    message: `An appointment on ${appointment.date} at ${appointment.time} was cancelled by the student.`,
                    type: 'warning'
                });
            }

            // Check Waitlist
            const waitlistDocs = await Waitlist.find({ counselorId: appointment.counselorId, date: appointment.date, status: 'active' }).populate('studentId');
            if (waitlistDocs.length > 0) {
                for (const wl of waitlistDocs) {
                    if (wl.studentId && wl.studentId.email) {
                        await sendEmail({
                            to: wl.studentId.email,
                            subject: 'A counseling slot has opened up!',
                            text: `Great news! A session slot with your counselor has just opened up on ${appointment.date}.\n\nPlease log in to your dashboard to book it before it gets taken.`
                        });
                        wl.status = 'notified';
                        await wl.save();
                    }
                }
            }

            res.json(updatedAppointment);

        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reschedule appointment (Student)
// @route   PUT /api/appointments/:id/reschedule
// @access  Private/Student
router.put('/:id/reschedule', protect, student, async (req, res) => {
    try {
        const { newDate, newTime } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (String(appointment.studentId) !== String(req.user._id)) return res.status(401).json({ message: 'Not authorized' });
        if (appointment.status === 'completed' || appointment.status === 'rejected') return res.status(400).json({ message: 'Cannot reschedule completed or rejected appointments' });

        // Check if new slot is free
        const existing = await Appointment.findOne({ counselorId: appointment.counselorId, date: newDate, time: newTime, status: { $in: ['pending', 'approved'] } });
        if (existing) return res.status(400).json({ message: 'New timeslot is already booked or pending' });

        appointment.date = newDate;
        appointment.time = newTime;
        appointment.status = 'pending'; // Reset to pending so counselor can approve again
        const updatedAppointment = await appointment.save();

        // Notify Counselor
        const counselorObj = await Counselor.findById(appointment.counselorId);
        if (counselorObj) {
            await Notification.create({
                userId: counselorObj.userId,
                title: 'Appointment Rescheduled',
                message: `An appointment was rescheduled by the student to ${newDate} at ${newTime}. Please review.`,
                type: 'info'
            });
        }

        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
