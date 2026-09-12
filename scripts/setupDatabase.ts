import { initializeDatabase, syncDatabase } from '../src/config/database';
import logger from '../src/config/logger';

const setupDatabase = async () => {
  try {
    logger.info('Setting up database...');
    await syncDatabase({ alter: true, force: false });
    logger.info('✓ Database setup complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Database setup failed: ${error}`);
    process.exit(1);
  }
};

setupDatabase();
