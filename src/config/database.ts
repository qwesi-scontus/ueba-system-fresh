import { Sequelize } from 'sequelize';
import { config } from './config';
import logger from './logger';

const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('✓ Database connection established');

    await sequelize.sync({ alter: false });
    logger.info('✓ Database models synced');
  } catch (error) {
    logger.error('✗ Database initialization failed:', error);
    throw error;
  }
}

export async function syncDatabase(options = { alter: false, force: false }) {
  try {
    await sequelize.sync(options);
    logger.info('✓ Database synchronized');
  } catch (error) {
    logger.error('✗ Database sync failed:', error);
    throw error;
  }
}

export default sequelize;
