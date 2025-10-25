import express from 'express';
import { signup, login, googleCallback, getProfile, logout } from '../controllers/authController.js';
import { storage } from '../config/cloudinary.js';
import multer from 'multer';
import { getGoogleAuthUrl } from '../config/googleAuth.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage });

router.post('/signup', upload.single('profileImage'), signup);
router.post('/login', login);
router.get('/google', (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});
router.get('/google/callback', googleCallback);
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

export default router;