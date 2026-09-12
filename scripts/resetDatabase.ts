import { syncDatabase } from '../src/config/database';
import logger from '../src/config/logger';

const resetDatabase = async () => {
  try {
    logger.info('Resetting database...');
    await syncDatabase({ alter: false, force: true });
    logger.info('✓ Database reset complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Database reset failed: ${error}`);
    process.exit(1);
  }
};

resetDatabase();
