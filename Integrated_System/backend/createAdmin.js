import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin',
        });

        console.log('Admin created successfully:');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createAdmin();
