import winston from 'winston';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1'; // automatically true on Vercel

// Create log directory only if running locally
if (!isVercel) {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
}

const transports = [];

// Always log to console (works on both local + Vercel)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

// Add file transports only when not on Vercel
if (!isVercel) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

export default logger;
