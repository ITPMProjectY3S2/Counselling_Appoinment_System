import Waitlist from '../models/Waitlist.js';
import Appointment from '../models/Appointment.js';

export const joinWaitlist = async (req, res) => {
    try {
        const { counselorId, date } = req.body;
        
        const existing = await Waitlist.findOne({ 
            studentId: req.user.id, 
            counselorId, 
            date, 
            status: 'active' 
        });
        
        if (existing) {
            return res.status(400).json({ message: 'You are already on the waitlist for this date.' });
        }

        const waitlistEntry = await Waitlist.create({
            studentId: req.user.id,
            counselorId,
            date
        });

        res.status(201).json(waitlistEntry);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getMyWaitlist = async (req, res) => {
    try {
        const list = await Waitlist.find({ studentId: req.user.id, status: 'active' })
            .populate({ path: 'counselorId', populate: { path: 'userId', select: 'name email' } })
            .sort('-createdAt');
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
