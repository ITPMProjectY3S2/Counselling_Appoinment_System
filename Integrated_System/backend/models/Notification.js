import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            default: 'info'
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
