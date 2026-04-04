import express from 'express';
import Appointment from '../models/Appointment.js';
import Feedback from '../models/Feedback.js';
import Counselor from '../models/Counselor.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get appointment stats (Daily, Weekly, Monthly)
// @route   GET /api/reports/appointments/stats
// @access  Private/Admin
router.get('/appointments/stats', protect, admin, async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const daily = await Appointment.countDocuments({ createdAt: { $gte: startOfDay } });
        const weekly = await Appointment.countDocuments({ createdAt: { $gte: startOfWeek } });
        const monthly = await Appointment.countDocuments({ createdAt: { $gte: startOfMonth } });

        // Get trends (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const trends = await Appointment.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ daily, weekly, monthly, trends });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get counselor performance metrics
// @route   GET /api/reports/counselors/performance
// @access  Private/Admin
router.get('/counselors/performance', protect, admin, async (req, res) => {
    try {
        const performance = await Counselor.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'counselorId',
                    as: 'appointments'
                }
            },
            {
                $addFields: {
                    totalSessions: { $size: '$appointments' },
                    completedSessions: {
                        $size: {
                            $filter: {
                                input: '$appointments',
                                as: 'appt',
                                cond: { $eq: ['$$appt.status', 'completed'] }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'feedbacks',
                    localField: 'appointments._id',
                    foreignField: 'appointmentId',
                    as: 'feedbacks'
                }
            },
            {
                $addFields: {
                    avgRating: { $avg: '$feedbacks.rating' }
                }
            },
            {
                $project: {
                    name: '$userInfo.name',
                    specialty: 1,
                    totalSessions: 1,
                    completedSessions: 1,
                    avgRating: { $ifNull: ['$avgRating', 0] }
                }
            }
        ]);

        res.json(performance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get mental health insights
// @route   GET /api/reports/mental-health/insights
// @access  Private/Admin
router.get('/mental-health/insights', protect, admin, async (req, res) => {
    try {
        // Problem types distribution
        const problemTypes = await Appointment.aggregate([
            {
                $group: {
                    _id: "$problemType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Peak hours
        const peakHours = await Appointment.aggregate([
            {
                $group: {
                    _id: "$time",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ problemTypes, peakHours });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get detailed counselor feedback analysis
// @route   GET /api/reports/counselors/feedback-analysis
// @access  Private/Admin
router.get('/counselors/feedback-analysis', protect, admin, async (req, res) => {
    try {
        const feedbackAnalysis = await Counselor.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'counselorId',
                    as: 'appointments'
                }
            },
            {
                $lookup: {
                    from: 'feedbacks',
                    localField: 'appointments._id',
                    foreignField: 'appointmentId',
                    as: 'feedbacks'
                }
            },
            {
                $addFields: {
                    completedAppointments: {
                        $filter: {
                            input: '$appointments',
                            as: 'appt',
                            cond: { $eq: ['$$appt.status', 'completed'] }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalFeedbacks: { $size: '$feedbacks' },
                    avgRating: { $avg: '$feedbacks.rating' },
                    completedCount: { $size: '$completedAppointments' },
                    ratingDistribution: {
                        1: { $size: { $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.rating', 1] } } } },
                        2: { $size: { $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.rating', 2] } } } },
                        3: { $size: { $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.rating', 3] } } } },
                        4: { $size: { $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.rating', 4] } } } },
                        5: { $size: { $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.rating', 5] } } } }
                    },
                    latestComments: {
                        $slice: [
                            {
                                $map: {
                                    input: { $sortArray: { input: '$feedbacks', sortBy: { createdAt: -1 } } },
                                    as: 'f',
                                    in: {
                                        comment: '$$f.comment',
                                        rating: '$$f.rating',
                                        date: '$$f.createdAt'
                                    }
                                }
                            },
                            3
                        ]
                    }
                }
            },
            {
                $project: {
                    name: '$userInfo.name',
                    specialty: 1,
                    totalFeedbacks: 1,
                    avgRating: { $ifNull: ['$avgRating', 0] },
                    completedCount: 1,
                    submissionRate: {
                        $cond: [
                            { $gt: ['$completedCount', 0] },
                            { $multiply: [{ $divide: ['$totalFeedbacks', '$completedCount'] }, 100] },
                            0
                        ]
                    },
                    ratingDistribution: 1,
                    latestComments: 1
                }
            }
        ]);

        res.json(feedbackAnalysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get system health KPIs
// @route   GET /api/reports/system-health
// @access  Private/Admin
router.get('/system-health', protect, admin, async (req, res) => {
    try {
        const allAppointments = await Appointment.find({});
        const totalAppointments = allAppointments.length;

        // 1. Completion Rate
        const completedCount = allAppointments.filter(a => a.status === 'completed').length;
        const completionRate = totalAppointments > 0
            ? Math.round((completedCount / totalAppointments) * 100)
            : 0;

        // 2. Student Return Rate (students with ≥2 appointments)
        const studentCounts = {};
        allAppointments.forEach(a => {
            const sid = a.studentId?.toString();
            if (sid) studentCounts[sid] = (studentCounts[sid] || 0) + 1;
        });
        const totalUniqueStudents = Object.keys(studentCounts).length;
        const returningStudents = Object.values(studentCounts).filter(c => c >= 2).length;
        const returnRate = totalUniqueStudents > 0
            ? Math.round((returningStudents / totalUniqueStudents) * 100)
            : 0;

        // 3. Average Wait Time (days from created to approved/completed)
        const resolvedAppts = allAppointments.filter(a =>
            ['approved', 'completed'].includes(a.status) && a.createdAt && a.updatedAt
        );
        const avgWaitMs = resolvedAppts.length > 0
            ? resolvedAppts.reduce((acc, a) => acc + (new Date(a.updatedAt) - new Date(a.createdAt)), 0) / resolvedAppts.length
            : 0;
        const avgWaitDays = parseFloat((avgWaitMs / (1000 * 60 * 60 * 24)).toFixed(1));

        // 4. Counselor Utilization (avg sessions per counselor)
        const counselorCounts = {};
        allAppointments.forEach(a => {
            const cid = a.counselorId?.toString();
            if (cid) counselorCounts[cid] = (counselorCounts[cid] || 0) + 1;
        });
        const totalCounselors = Object.keys(counselorCounts).length;
        const avgSessionsPerCounselor = totalCounselors > 0
            ? parseFloat((totalAppointments / totalCounselors).toFixed(1))
            : 0;

        res.json({
            completionRate,
            returnRate,
            avgWaitDays,
            avgSessionsPerCounselor,
            totalAppointments,
            totalCounselors,
            returningStudents,
            totalUniqueStudents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get appointment status breakdown (for donut chart)
// @route   GET /api/reports/appointments/status-breakdown
// @access  Private/Admin
router.get('/appointments/status-breakdown', protect, admin, async (req, res) => {
    try {
        const breakdown = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json(breakdown);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

