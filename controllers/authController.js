import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { verifyGoogleToken } from '../config/googleAuth.js';

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let profileImage = '';

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profiles',
          allowed_formats: ['jpg', 'png', 'jpeg'],
        });
        profileImage = result.secure_url;
        logger.info(`Profile image uploaded to Cloudinary: ${profileImage}`);
      } catch (uploadError) {
        logger.error(`Cloudinary upload error: ${uploadError.message}`);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      profileImage,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`User logged in: ${email}`);
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { googleId, email, name, picture } = await verifyGoogleToken(code);

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user (for login)
        if (!user.googleId) {
          user.googleId = googleId;
          user.profileImage = user.profileImage || picture;
          await user.save();
          logger.info(`Google account linked for user: ${email}`);
        }
      } else {
        // Create new user (signup via Google)
        user = new User({
          name,
          email,
          googleId,
          profileImage: picture,
        });
        await user.save();
        logger.info(`New user registered via Google: ${email}`);
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    logger.info(`Google OAuth success for user: ${user.email}`);
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  } catch (error) {
    logger.error(`Google callback error: ${error.message}`);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -googleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Profile retrieved for user: ${user.email}`);
    res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (error) {
    logger.error(`Profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Add token to in-memory blacklist (replace with Redis in production)
      if (!global.blacklist) global.blacklist = new Set();
      global.blacklist.add(token);
      logger.info(`Token blacklisted for user ID: ${req.userId}`);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export { signup, login, googleCallback, getProfile, logout };