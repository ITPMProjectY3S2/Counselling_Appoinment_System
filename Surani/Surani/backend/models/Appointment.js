import mongoose from 'mongoose';

const appointmentSchema = mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        counselorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Counselor',
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String, // e.g., '09:00-10:00'
            required: true,
        },
        problemType: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
            default: 'pending',
        },
        rejectionReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
