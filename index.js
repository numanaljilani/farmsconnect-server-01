import express from 'express';
import { createServer } from 'http';
import cluster from 'cluster';
import { cpus } from 'os';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import categoryRoutes from './routes/categoryRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
dotenv.config();

if (cluster.isPrimary) {
  const numCPUs = cpus().length;
  logger.info(`Primary ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code: ${code}, signal: ${signal}`);
    cluster.fork();
  });
} else {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(cors({ origin:'*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Connect to MongoDB
  await connectDB();

  // Routes
  app.get("/",(req,res)=>{
    res.json({status : 200 , message : "server is working ..."})
  })
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes); // categoryRoutes
  app.use('/api/listings', listingRoutes); // categoryRoutes

  // Error Handler
  app.use(errorHandler);

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`Worker ${process.pid} running on port ${PORT}`);
  });
}