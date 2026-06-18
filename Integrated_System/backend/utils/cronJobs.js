import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';

export const initCronJobs = () => {
    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('Running daily cron job for appointment reminders...');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Find all approved appointments taking place tomorrow
            const upcomingAppointments = await Appointment.find({
                date: tomorrowStr,
                status: 'approved'
            });

            for (const appt of upcomingAppointments) {
                const studentUser = await User.findById(appt.studentId);
                
                // Notify Student
                await Notification.create({
                    userId: appt.studentId,
                    title: 'Upcoming Appointment Reminder',
                    message: `Reminder: You have a counseling session tomorrow at ${appt.time}.`,
                    type: 'info'
                });
                
                // Email Student
                if (studentUser && studentUser.email) {
                    await sendEmail({
                        to: studentUser.email,
                        subject: 'Reminder: Upcoming Session Tomorrow',
                        text: `This is an automated reminder that you have a scheduled counseling session tomorrow at ${appt.time}.\n\nPlease log in to your dashboard to review any details or reschedule if needed.`
                    });
                }
                
                // Notify Counselor
                const counselorObj = await Counselor.findById(appt.counselorId);
                if (counselorObj) {
                    await Notification.create({
                        userId: counselorObj.userId,
                        title: 'Upcoming Session Reminder',
                        message: `Reminder: You have a session scheduled tomorrow at ${appt.time}.`,
                        type: 'info'
                    });
                }
            }
            console.log(`Sent reminders for ${upcomingAppointments.length} appointments.`);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};
