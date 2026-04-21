import mongoose from 'mongoose';
import dns from 'dns';

// Fix local Node.js network bug refusing IPv6 SRV Lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

import Counselor from './models/Counselor.js';
import User from './models/User.js';

const uri = 'mongodb+srv://pasanpasan42:pasan123@cluster0.7yy3s.mongodb.net/counseling-appointment-system?appName=Cluster0';

async function testRoute() {
  await mongoose.connect(uri);
  const activeUsers = await User.find({ role: 'counselor', isActive: true }).select('_id');
  const activeUserIds = activeUsers.map(u => u._id);
  const counselors = await Counselor.find({ userId: { $in: activeUserIds } }).populate('userId', 'name email');
  console.log('Result of route query:', counselors.length);
  console.log(counselors);
  process.exit(0);
}

testRoute().catch(console.error);
