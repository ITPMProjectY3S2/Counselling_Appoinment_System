import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get conversation between logged in user and another user
router.get('/:userId', protect, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// Send a message
router.post('/', protect, async (req, res) => {
    const { receiverId, content } = req.body;
    try {
        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Receiver and content are required' });
        }
        
        const message = new Message({
            sender: req.user._id,
            receiver: receiverId,
            content
        });
        
        const createdMessage = await message.save();
        res.status(201).json(createdMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error sending message' });
    }
});

export default router;
