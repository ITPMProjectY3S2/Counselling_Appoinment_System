import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const existing = await User.findOne({ email: 'admin@counseling.com' });
    if (existing) {
        console.log('Admin already exists:', existing.email);
        process.exit(0);
    }

    const admin = new User({
        name: 'System Admin',
        email: 'admin@counseling.com',
        password: 'Admin@1234',
        role: 'admin',
        isActive: true,
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('   Email   : admin@counseling.com');
    console.log('   Password: Admin@1234');
    process.exit(0);
};

createAdmin().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
