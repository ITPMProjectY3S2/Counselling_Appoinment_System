import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/Counseling_App/Integrated_System/backend/.env' });

const rigorousCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        const users = await db.collection('users').find({}).toArray();
        console.log('---RIGOROUS USER CHECK---');
        users.forEach(u => {
            console.log(`Email: [${u.email}] | Role: [${u.role}] | Raw Role length: ${u.role?.length}`);
            if (u.role && u.role.trim() !== u.role) {
                console.log(`  !! ROLE HAS WHITESPACE: "${u.role}"`);
            }
        });

        const counselors = await db.collection('counselors').find({}).toArray();
        console.log('\n---RIGOROUS COUNSELOR CHECK---');
        counselors.forEach(c => {
            console.log(`CounselorID: [${c._id}] | userId: [${c.userId}] | userId instance: ${c.userId.constructor.name}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

rigorousCheck();
