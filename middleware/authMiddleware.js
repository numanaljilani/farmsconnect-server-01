import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Expect 'Bearer <token>'
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check if token is blacklisted (in-memory for simplicity)
    if (global.blacklist?.has(token)) {
      return res.status(401).json({ message: 'Token is invalid' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    logger.info(`Token verified for user ID: ${req.userId}`);
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;