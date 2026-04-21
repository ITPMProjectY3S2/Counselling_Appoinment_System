import mongoose from 'mongoose';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Counselor from '../models/Counselor.js';

// Fix local Node.js network bug refusing IPv6 SRV Lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Atlas connection refused: ${error.message}`);
    console.log('Falling back to In-Memory MongoDB Server...');
    
    try {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);

      // Seed an Admin user to allow local testing
      const existing = await User.findOne({ email: 'admin@counseling.com' });
      if (!existing) {
        const admin = new User({
          name: 'System Admin',
          email: 'admin@counseling.com',
          password: 'Admin@1234', // Model will hash this via pre-save hook
          role: 'admin',
          isActive: true,
        });
        await admin.save();
        console.log('✅ Default Admin seeded in memory for testing (admin@counseling.com // Admin@1234)');

        // Seed a sample counselor too
        const existingCounselor = await User.findOne({ email: 'sarah@counseling.com' });
        if (!existingCounselor) {
          const cUser = new User({
            name: 'Dr. Sarah Jenkins',
            email: 'sarah@counseling.com',
            password: 'Password@123',
            role: 'counselor',
            isActive: true,
          });
          await cUser.save();

          const counselor = new Counselor({
            userId: cUser._id,
            specialty: 'Academic Stress & Anxiety',
            availableDays: ['Monday', 'Wednesday', 'Friday'],
            availableTimeSlots: ['09:00-10:00', '11:00-12:00', '14:00-15:00']
          });
          await counselor.save();
          console.log('✅ Default Counselor seeded in memory (sarah@counseling.com)');
        }
      }
    } catch (fallbackError) {
      console.error(`In-Memory DB Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
