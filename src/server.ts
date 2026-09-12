import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import { initializeDatabase } from './config/database';
import { config } from './config/config';
import apiRoutes from './routes/api';
import dashboardRoutes from './routes/dashboard';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    logger.info('Initializing database...');
    await initializeDatabase();

    app.listen(config.port, () => {
      logger.info(`✓ Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();

export default app;
