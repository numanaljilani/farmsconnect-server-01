import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import categoryRoutes from './routes/categoryRoutes.js';
import listingRoutes from './routes/listingRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
await connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ status: 200, message: 'Server is working...' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);

// Error Handler
app.use(errorHandler);

// Log start info (Vercel handles the actual HTTP server)
logger.info('Express app initialized successfully');

// ✅ Export the app for Vercel
export default app;
