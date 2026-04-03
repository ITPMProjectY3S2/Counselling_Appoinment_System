import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';
import User from './models/User.js';
import Counselor from './models/Counselor.js';

dotenv.config();

const verifyStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const student = await User.findOne({ role: 'student' });
        const counselor = await Counselor.findOne({});

        if (!student || !counselor) {
            console.log('Could not find student or counselor to create test appointment.');
            process.exit(1);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        console.log(`Creating test appointment for today: ${todayStr}`);

        // Create a test appointment
        const testAppt = await Appointment.create({
            studentId: student._id,
            counselorId: counselor._id,
            date: todayStr,
            time: '10:00-11:00',
            problemType: 'Stress Management',
            status: 'pending'
        });

        console.log(`Test appointment created: ${testAppt._id}`);

        // Now we can mock a request to the summary logic or just run the queries manually here to verify
        const dailyCount = await Appointment.countDocuments({ date: todayStr });
        const weeklyCount = await Appointment.countDocuments({ date: { $gte: todayStr } }); // simplified check

        console.log(`Verification Results:`);
        console.log(`- Daily Count: ${dailyCount} (Expected: >= 1)`);
        console.log(`- Weekly Count: ${weeklyCount} (Expected: >= 1)`);

        // Clean up
        await Appointment.findByIdAndDelete(testAppt._id);
        console.log('Test appointment cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyStats();
