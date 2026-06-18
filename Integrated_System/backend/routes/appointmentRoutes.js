import express from 'express';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import User from '../models/User.js';
import Waitlist from '../models/Waitlist.js';
import Notification from '../models/Notification.js';
import { protect, counselor, student } from '../middleware/authMiddleware.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

// @desc    Create appointment
router.post('/', protect, student, async (req, res) => {
    try {
        const { counselorId, date, time, problemType } = req.body;
        const existing = await Appointment.findOne({ counselorId, date, time, status: { $in: ['pending', 'approved'] } });
        if (existing) return res.status(400).json({ message: 'Timeslot is already booked or pending' });

        const appointment = await Appointment.create({
            studentId: req.user._id,
            counselorId,
            date,
            time,
            problemType,
        });

        await Notification.create({
            userId: req.user._id,
            title: 'Booking Request Submitted',
            message: `Your booking request for ${date} at ${time} has been sent.`,
            type: 'info'
        });

        const counselorObj = await Counselor.findById(counselorId);
        if (counselorObj) {
            await Notification.create({
                userId: counselorObj.userId,
                title: 'New Booking Request',
                message: `You have a new booking request for ${date} at ${time}.`,
                type: 'info'
            });
        }

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my appointments
router.get('/myappointments', protect, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const appointments = await Appointment.find({ studentId: req.user._id })
                .populate({ path: 'counselorId', populate: { path: 'userId', select: 'name email' } })
                .sort({ date: -1 });
            console.log(`[TRACE] Found ${appointments.length} appointments for student ${req.user.email}`);
            res.json(appointments);
        } else if (req.user.role === 'counselor') {
            const profile = await Counselor.findOne({ userId: req.user._id });
            if (!profile) return res.status(404).json({ message: 'Counselor profile not found' });
            const appointments = await Appointment.find({ counselorId: profile._id })
                .populate('studentId', 'name email')
                .sort({ date: -1 });
            console.log(`[TRACE] Found ${appointments.length} appointments for counselor ${req.user.email}`);
            res.json(appointments);
        } else {
            console.log(`[TRACE] Admin viewing appointments is not implemented here`);
            res.status(401).json({ message: 'Not authorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update status
router.put('/:id/status', protect, counselor, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (appointment) {
            const profile = await Counselor.findOne({ userId: req.user._id });
            if (req.user.role !== 'admin' && String(appointment.counselorId) !== String(profile._id)) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            appointment.status = status;
            if (status === 'rejected' && rejectionReason) appointment.rejectionReason = rejectionReason;
            await appointment.save();

            await Notification.create({
                userId: appointment.studentId,
                title: `Appointment ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                message: `Your appointment on ${appointment.date} at ${appointment.time} has been ${status}.`,
                type: status === 'approved' ? 'success' : 'error'
            });

            if (status === 'approved') {
                const studentUser = await User.findById(appointment.studentId);
                if (studentUser && studentUser.email) {
                    await sendEmail({
                        to: studentUser.email,
                        subject: 'Counseling Appointment Approved',
                        text: `Your counseling appointment on ${appointment.date} at ${appointment.time} has been approved.`
                    });
                }
            }

            res.json(appointment);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel appointment
router.put('/:id/cancel', protect, student, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (String(appointment.studentId) !== String(req.user._id)) return res.status(401).json({ message: 'Not authorized' });

        appointment.status = 'cancelled';
        await appointment.save();

        const counselorObj = await Counselor.findById(appointment.counselorId);
        if (counselorObj) {
            await Notification.create({
                userId: counselorObj.userId,
                title: 'Appointment Cancelled',
                message: `An appointment on ${appointment.date} at ${appointment.time} was cancelled by the student.`,
                type: 'warning'
            });
        }

        // Waitlist notification
        const onWaitlist = await Waitlist.find({ counselorId: appointment.counselorId, date: appointment.date, status: 'active' }).populate('studentId');
        for (const wl of onWaitlist) {
            if (wl.studentId && wl.studentId.email) {
                await sendEmail({
                    to: wl.studentId.email,
                    subject: 'A counseling slot has opened up!',
                    text: `A slot for your counselor has opened up on ${appointment.date}.`
                });
                wl.status = 'notified';
                await wl.save();
            }
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reschedule
router.put('/:id/reschedule', protect, student, async (req, res) => {
    try {
        const { newDate, newTime } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (String(appointment.studentId) !== String(req.user._id)) return res.status(401).json({ message: 'Not authorized' });

        const existing = await Appointment.findOne({ counselorId: appointment.counselorId, date: newDate, time: newTime, status: { $in: ['pending', 'approved'] } });
        if (existing) return res.status(400).json({ message: 'New timeslot is already booked' });

        appointment.date = newDate;
        appointment.time = newTime;
        appointment.status = 'pending';
        await appointment.save();

        const counselorObj = await Counselor.findById(appointment.counselorId);
        if (counselorObj) {
            await Notification.create({
                userId: counselorObj.userId,
                title: 'Appointment Rescheduled',
                message: `An appointment was rescheduled to ${newDate} at ${newTime}.`,
                type: 'info'
            });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
