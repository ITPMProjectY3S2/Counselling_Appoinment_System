import express from 'express';
import Counselor from '../models/Counselor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { protect, counselor } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all active counselors
router.get('/', protect, async (req, res) => {
    try {
        const activeUsers = await User.find({ role: 'counselor', isActive: true }).select('_id');
        const activeIds = activeUsers.map(u => u._id);
        const counselors = await Counselor.find({ userId: { $in: activeIds } }).populate('userId', 'name email');
        res.json(counselors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current counselor profile
router.get('/me', protect, counselor, async (req, res) => {
    try {
        console.log(`[GET /me] User ID: ${req.user._id}`);
        const counselorDoc = await Counselor.findOne({ userId: req.user._id }).populate('userId', 'name email');
        if (!counselorDoc) {
            console.warn(`[GET /me] Counselor profile NOT FOUND for user ${req.user._id}`);
            return res.status(404).json({ message: 'Counselor profile not found' });
        }
        console.log(`[GET /me] Found counselor ID: ${counselorDoc._id}, weeklyAvailability count: ${counselorDoc.weeklyAvailability?.length || 0}`);
        res.json(counselorDoc);
    } catch (error) {
        console.error(`[GET /me] Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Availability
router.post('/availability', protect, counselor, async (req, res) => {
    try {
        const { day, slots, applyToAllDays } = req.body;
        console.log(`[POST /availability] Request: Day=${day}, SlotsCount=${slots?.length || 0}, AllDays=${applyToAllDays || false}`);

        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ message: 'Slots array is required' });
        }

        let counselorDoc = await Counselor.findOne({ userId: req.user._id });
        if (!counselorDoc) return res.status(404).json({ message: 'Counselor profile not found' });

        if (!counselorDoc.weeklyAvailability) counselorDoc.weeklyAvailability = [];

        if (applyToAllDays) {
            console.log(`[POST /availability] Applying slots to ALL days of the week.`);
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            // Set for all days
            counselorDoc.weeklyAvailability = daysOfWeek.map(d => ({
                day: d,
                slots: slots
            }));
        } else {
            if (!day) return res.status(400).json({ message: 'Day is required when not applying to all days' });
            
            // Find existing day in weeklyAvailability
            const dayIndex = counselorDoc.weeklyAvailability.findIndex(wa => wa.day === day);

            if (dayIndex !== -1) {
                console.log(`[POST /availability] Updating existing day: ${day}`);
                counselorDoc.weeklyAvailability[dayIndex].slots = slots;
            } else {
                console.log(`[POST /availability] Adding new day entry: ${day}`);
                counselorDoc.weeklyAvailability.push({ day, slots });
            }
        }

        // Extremely important for array updates in Mongoose
        counselorDoc.markModified('weeklyAvailability');
        await counselorDoc.save();
        
        console.log(`[POST /availability] Successfully saved schedule.`);
        res.json({ message: 'Availability updated', counselor: counselorDoc });
    } catch (error) {
        console.error(`[POST /availability] Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Availability Slot
router.delete('/availability', protect, counselor, async (req, res) => {
    try {
        const { day, time } = req.query;
        console.log(`[DELETE /availability] Request: Day=${day}, Time=${time}`);

        if (!day || !time) return res.status(400).json({ message: 'Day and time slot are required' });

        let counselorDoc = await Counselor.findOne({ userId: req.user._id });
        if (!counselorDoc) return res.status(404).json({ message: 'Counselor profile not found' });

        const hasAppt = await Appointment.findOne({
            counselorId: counselorDoc._id,
            time: time,
            status: { $in: ['pending', 'approved'] }
        });

        if (hasAppt) {
            console.warn(`[DELETE /availability] Blocked: Appointments exist for ${time}`);
            return res.status(400).json({ message: 'Cannot delete: Pending or approved appointments exist in this slot.' });
        }

        // Filter the slot from the specific day
        const dayEntry = counselorDoc.weeklyAvailability.find(wa => wa.day === day);
        if (dayEntry) {
            dayEntry.slots = dayEntry.slots.filter(s => s !== time);
            console.log(`[DELETE /availability] Removed ${time} from ${day}. Remaining: ${dayEntry.slots.length}`);
            
            if (dayEntry.slots.length === 0) {
                console.log(`[DELETE /availability] Removing empty day entry: ${day}`);
                counselorDoc.weeklyAvailability = counselorDoc.weeklyAvailability.filter(wa => wa.day !== day);
            }
        }

        counselorDoc.markModified('weeklyAvailability');
        await counselorDoc.save();
        res.json({ message: 'Availability removed', counselor: counselorDoc });
    } catch (error) {
        console.error(`[DELETE /availability] Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

export default router;
