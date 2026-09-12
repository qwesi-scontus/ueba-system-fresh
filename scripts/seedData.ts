import { syncDatabase } from '../src/config/database';
import { DataPipeline } from '../src/services/DataPipeline';
import { BehaviorAnalyticsEngine } from '../src/services/BehaviorAnalyticsEngine';
import logger from '../src/config/logger';
import dayjs from 'dayjs';

const dataPipeline = new DataPipeline();
const analyticsEngine = new BehaviorAnalyticsEngine();

const USERS = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
const RESOURCES = ['database', 'fileserver', 'api', 'admin-panel', 'config-store'];
const ACTIONS = ['login', 'logout', 'read', 'write', 'delete', 'execute'];
const EVENT_TYPES = ['authentication', 'data_access', 'privilege_change', 'resource_access'];

function generateRandomEvent(anomalous = false) {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  const now = new Date();
  const hoursBack = Math.floor(Math.random() * 24);
  const timestamp = dayjs(now).subtract(hoursBack, 'hours').toDate();

  let sourceIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
  if (anomalous) {
    sourceIp = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  return {
    userId: user,
    eventType: EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)],
    timestamp,
    sourceIp,
    action: anomalous ? 'sudo rm -rf' : ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
    resource: RESOURCES[Math.floor(Math.random() * RESOURCES.length)],
    result: Math.random() > 0.95 ? 'failure' : 'success',
    metadata: {
      userAgent: 'Mozilla/5.0',
      location: sourceIp,
      severity: anomalous ? 'high' : 'normal',
    },
  };
}

const seedData = async () => {
  try {
    logger.info('🌱 Starting data seeding...');

    // Ensure database is synced
    await syncDatabase({ alter: false, force: false });

    // Seed normal events
    logger.info('Generating normal events...');
    for (let i = 0; i < 100; i++) {
      const event = generateRandomEvent(false);
      await dataPipeline.ingestEvent(event);
    }

    // Seed anomalous events
    logger.info('Generating anomalous events...');
    for (let i = 0; i < 10; i++) {
      const event = generateRandomEvent(true);
      await dataPipeline.ingestEvent(event);
    }

    // Build baselines for all users
    logger.info('Building user baselines...');
    for (const user of USERS) {
      await analyticsEngine.buildUserBaseline(user);
    }

    logger.info('✓ Data seeding completed successfully');
    logger.info(`✓ Created ${USERS.length} user profiles`);
    logger.info('✓ System ready for use');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error}`);
    process.exit(1);
  }
};

seedData();
