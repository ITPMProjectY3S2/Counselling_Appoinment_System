import express from 'express';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get summary statistics (daily, weekly, monthly appointments)
// @route   GET /api/analytics/summary
// @access  Private/Admin
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const todayRef = new Date();
        todayRef.setHours(0, 0, 0, 0);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const todayStr = formatDate(todayRef);

        const thisWeekRef = new Date(todayRef);
        thisWeekRef.setDate(todayRef.getDate() - todayRef.getDay()); // Sunday
        const thisWeekStr = formatDate(thisWeekRef);

        const thisMonthRef = new Date(todayRef.getFullYear(), todayRef.getMonth(), 1);
        const thisMonthStr = formatDate(thisMonthRef);

        const lastWeekRef = new Date(thisWeekRef);
        lastWeekRef.setDate(thisWeekRef.getDate() - 7);
        const lastWeekStr = formatDate(lastWeekRef);

        console.log(`[DEBUG] Summary Queries - Today: ${todayStr}, Week: ${thisWeekStr}, Month: ${thisMonthStr}`);

        const dailyCount = await Appointment.countDocuments({ date: todayStr });
        const weeklyCount = await Appointment.countDocuments({ date: { $gte: thisWeekStr }, status: { $ne: 'cancelled' } });
        const lastWeekCount = await Appointment.countDocuments({ date: { $gte: lastWeekStr, $lt: thisWeekStr }, status: { $ne: 'cancelled' } });
        const monthlyCount = await Appointment.countDocuments({ date: { $gte: thisMonthStr }, status: { $ne: 'cancelled' } });

        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCounselors = await User.countDocuments({ role: 'counselor' });

        res.json({
            appointments: {
                daily: dailyCount,
                weekly: weeklyCount,
                lastWeek: lastWeekCount,
                monthly: monthlyCount,
            },
            users: {
                students: totalStudents,
                counselors: totalCounselors
            }
        });
    } catch (error) {
        console.error(`[DEBUG] Summary Analytics Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get mental health insights (status & peak hours)
// @route   GET /api/analytics/insights
// @access  Private/Admin
router.get('/insights', protect, admin, async (req, res) => {
    try {
        const statuses = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const peakHours = await Appointment.aggregate([
            { $group: { _id: '$time', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            statusDistribution: statuses.map(s => ({ status: s._id, count: s.count })),
            peakHours: peakHours.map(p => ({ time: p._id, count: p.count }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get counselor performance metrics
// @route   GET /api/analytics/performance
// @access  Private/Admin
router.get('/performance', protect, admin, async (req, res) => {
    try {
        const counselors = await Counselor.find({}).populate('userId', 'name email');

        const performanceData = await Promise.all(counselors.map(async (counselor) => {
            const completedCount = await Appointment.countDocuments({ counselorId: counselor._id, status: 'completed' });

            const sessions = await Appointment.find({ counselorId: counselor._id, status: 'completed' }).select('_id');
            const sessionIds = sessions.map(s => s._id);

            const feedbacks = await Feedback.find({ appointmentId: { $in: sessionIds } });

            let avgRating = 0;
            if (feedbacks.length > 0) {
                const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
                avgRating = (totalRating / feedbacks.length).toFixed(1);
            }

            return {
                id: counselor._id,
                name: counselor.userId?.name || 'Unknown',
                email: counselor.userId?.email || 'N/A',
                specialty: counselor.specialty,
                completedSessions: completedCount,
                avgRating: parseFloat(avgRating),
                totalFeedback: feedbacks.length
            };
        }));

        performanceData.sort((a, b) => b.avgRating - a.avgRating || b.completedSessions - a.completedSessions);

        res.json(performanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
