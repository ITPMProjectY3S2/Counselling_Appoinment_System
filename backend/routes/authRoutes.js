import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Register a new user (student by default)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated. Contact admin.' });
        }

        if (await user.matchPassword(password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                phoneNumber: user.phoneNumber,
                studentId: user.studentId,
                examYear: user.examYear,
                institute: user.institute,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                studentId: user.studentId,
                examYear: user.examYear,
                institute: user.institute
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update basic profile fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
        user.studentId = req.body.studentId !== undefined ? req.body.studentId : user.studentId;
        user.examYear = req.body.examYear !== undefined ? req.body.examYear : user.examYear;
        user.institute = req.body.institute || user.institute;

        // Current password validation for new password flow
        if (req.body.currentPassword || req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Please provide your current password to change password.' });
            }
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }
            if (!req.body.newPassword) {
                return res.status(400).json({ message: 'Please provide a new password.' });
            }
            user.password = req.body.newPassword;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phoneNumber: updatedUser.phoneNumber,
            studentId: updatedUser.studentId,
            examYear: updatedUser.examYear,
            institute: updatedUser.institute,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



export default router;
