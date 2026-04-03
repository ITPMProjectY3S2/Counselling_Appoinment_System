import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/authMiddleware.js';

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

        if (user && (await user.matchPassword(password))) {
            console.log(`[TRACE-AUTH] User ${user.email} logged in successfully. ID: ${user._id}`);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            console.log(`[TRACE-AUTH] Login failed for ${email}`);
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
                institute: user.institute,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

import Counselor from '../models/Counselor.js';

// ... existing code ...

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        console.log('[TRACE-AUTH] Profile Update Triggered. User ID:', req.user._id);
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Password Update Logic (Secure)
        if (req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set a new password' });
            }
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password' });
            }
            user.password = req.body.newPassword;
        }

        // 2. User Basic Fields
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) {
            const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
            if (emailExists) return res.status(400).json({ message: 'Email already in use' });
            user.email = req.body.email;
        }
        
        // Student specific fields
        if (user.role === 'student') {
            if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
            if (req.body.studentId !== undefined) user.studentId = req.body.studentId;
            if (req.body.examYear !== undefined) user.examYear = req.body.examYear;
            if (req.body.institute !== undefined) user.institute = req.body.institute;
        }

        // 3. Counselor Specific Fields
        if (user.role === 'counselor') {
            const counselorProfile = await Counselor.findOne({ userId: user._id });
            if (counselorProfile) {
                if (req.body.specialty) counselorProfile.specialty = req.body.specialty;
                if (req.body.profileImage !== undefined) counselorProfile.profileImage = req.body.profileImage;
                await counselorProfile.save();
                console.log('[TRACE-AUTH] Counselor profile fields updated');
            }
        }

        const updatedUser = await user.save();

        console.log('[TRACE-AUTH] Update successful for:', updatedUser.email);

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        console.error('[TRACE-AUTH-ERROR]', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
