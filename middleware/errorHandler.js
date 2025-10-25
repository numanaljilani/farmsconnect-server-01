import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}, Stack: ${err.stack}`);
  res.status(500).json({ message: 'Internal server error' });
};

export default errorHandler;