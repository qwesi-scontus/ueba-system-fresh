import EventLog from '../models/EventLog';
import AnomalyAlert from '../models/AnomalyAlert';
import UserProfile from '../models/UserProfile';
import logger from '../config/logger';
import dayjs from 'dayjs';

export class DataPipeline {
  async ingestEvent(eventData: any) {
    try {
      const event = await EventLog.create({
        userId: eventData.userId,
        eventType: eventData.eventType,
        timestamp: eventData.timestamp || new Date(),
        sourceIp: eventData.sourceIp,
        action: eventData.action,
        resource: eventData.resource,
        result: eventData.result || 'success',
        metadata: eventData.metadata || {},
        riskScore: eventData.riskScore || 0,
      });

      logger.info(`Event ingested: ${event.id} for user ${event.userId}`);
      return event;
    } catch (error) {
      logger.error(`Failed to ingest event: ${error}`);
      throw error;
    }
  }

  async getEventsForUser(userId: string, hoursBack: number = 24) {
    try {
      const fromTime = dayjs().subtract(hoursBack, 'hours').toDate();
      const events = await EventLog.findAll({
        where: {
          userId,
          timestamp: {
            [require('sequelize').Op.gte]: fromTime,
          },
        },
        order: [['timestamp', 'DESC']],
      });
      return events;
    } catch (error) {
      logger.error(`Failed to get events for user ${userId}: ${error}`);
      throw error;
    }
  }

  async getAllEvents(limit: number = 1000, offset: number = 0) {
    try {
      const events = await EventLog.findAll({
        limit,
        offset,
        order: [['timestamp', 'DESC']],
      });
      return events;
    } catch (error) {
      logger.error(`Failed to get events: ${error}`);
      throw error;
    }
  }
}
