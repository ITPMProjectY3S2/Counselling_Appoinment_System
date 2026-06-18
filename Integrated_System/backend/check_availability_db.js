import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Counselor from './models/Counselor.js';
import User from './models/User.js';

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const counselors = await Counselor.find({}).populate('userId', 'name email role');
        console.log(`Found ${counselors.length} counselors:`);
        
        counselors.forEach(c => {
            console.log(`- Counselor: ${c.userId?.name} (${c.userId?.email})`);
            console.log(`  Role: ${c.userId?.role}`);
            console.log(`  Weekly Availability: ${JSON.stringify(c.weeklyAvailability, null, 2)}`);
            console.log(`  Old Fields - Days: ${c.availableDays}, Slots: ${c.availableTimeSlots}`);
            console.log('-----------------------------------');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
