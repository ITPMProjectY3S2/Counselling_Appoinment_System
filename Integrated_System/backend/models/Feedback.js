import mongoose from 'mongoose';

const feedbackSchema = mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Appointment',
        },
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
        adminReply: {
            type: String,
        },
        adminReplyDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
