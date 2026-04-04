import mongoose from 'mongoose';

const counselorSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        specialty: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,
            default: '',
        },
        availableDays: [
            {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
        ],
        availableTimeSlots: [
            {
                type: String, // e.g., '09:00-10:00', '13:00-14:00'
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Counselor = mongoose.model('Counselor', counselorSchema);

export default Counselor;
