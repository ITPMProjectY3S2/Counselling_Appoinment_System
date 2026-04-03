import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { joinWaitlist, getMyWaitlist } from '../controllers/waitlistController.js';

const router = express.Router();

router.post('/', protect, joinWaitlist);
router.get('/my', protect, getMyWaitlist);

export default router;
