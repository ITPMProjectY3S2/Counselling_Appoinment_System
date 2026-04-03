import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';

dotenv.config();

const checkDates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const latestAppointments = await Appointment.find({}).sort({ createdAt: -1 }).limit(5);
        console.log('Latest 5 Appointments:');
        latestAppointments.forEach(a => {
            console.log(`- ID: ${a._id}, Date: ${a.date}, Type: ${typeof a.date}`);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        console.log(`Today String (ISO): ${todayStr}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDates();
