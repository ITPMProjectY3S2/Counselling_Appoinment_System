import mongoose from 'mongoose';

const waitlistSchema = mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        counselorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Counselor'
        },
        date: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'notified', 'booked', 'cancelled'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;
