import mongoose from 'mongoose';
import dns from 'dns';

// Fix local Node.js network bug refusing IPv6 SRV Lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://pasanpasan42:pasan123@cluster0.7yy3s.mongodb.net/counseling-appointment-system?appName=Cluster0';

// Minimal schema to test counselor reading
const CounselorSchema = new mongoose.Schema({}, { strict: false });
const Counselor = mongoose.model('Counselor', CounselorSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function checkData() {
  await mongoose.connect(uri);
  const counselors = await Counselor.find({});
  const users = await User.find({ role: 'counselor' });
  console.log('Counselors in DB:', counselors);
  console.log('Users with role counselor in DB:', users);
  process.exit(0);
}

checkData().catch(e => {
  console.error(e);
  process.exit(1);
});
