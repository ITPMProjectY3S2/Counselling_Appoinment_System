import Waitlist from '../models/Waitlist.js';

// @desc    Join waitlist for a counselor on a specific date
// @route   POST /api/waitlist
// @access  Private
export const joinWaitlist = async (req, res) => {
    try {
        const { counselorId, date } = req.body;

        const existing = await Waitlist.findOne({
            studentId: req.user._id,
            counselorId,
            date,
            status: 'active'
        });

        if (existing) {
            return res.status(400).json({ message: 'You are already on the waitlist for this day' });
        }

        const waitlist = await Waitlist.create({
            studentId: req.user._id,
            counselorId,
            date
        });

        res.status(201).json(waitlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my waitlist entries
// @route   GET /api/waitlist/my
// @access  Private
export const getMyWaitlist = async (req, res) => {
    try {
        const waitlist = await Waitlist.find({ studentId: req.user._id })
            .populate({
                path: 'counselorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        res.json(waitlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
