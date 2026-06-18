import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Counselor from './models/Counselor.js';
import User from './models/User.js';

dotenv.config();

const migrateDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const counselors = await Counselor.find({});
        console.log(`Found ${counselors.length} counselors for migration check.`);
        
        for (const c of counselors) {
            let updated = false;
            
            // Check if weeklyAvailability exists
            if (!c.weeklyAvailability || c.weeklyAvailability.length === 0) {
                console.log(`- Migrating counselor: ${c._id}`);
                
                // If they have old flat fields, migrate them to Monday for now or handle appropriately
                // But usually, we just want to ensure the array is initialized
                c.weeklyAvailability = [];
                updated = true;
            }

            if (updated) {
                c.markModified('weeklyAvailability');
                await c.save();
                console.log(`  Successfully updated document.`);
            } else {
                console.log(`- Counselor ${c._id} already has weeklyAvailability schema.`);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
};

migrateDB();
