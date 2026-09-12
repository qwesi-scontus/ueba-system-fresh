import EventLog from '../models/EventLog';
import AnomalyAlert from '../models/AnomalyAlert';
import UserProfile from '../models/UserProfile';
import logger from '../config/logger';
import dayjs from 'dayjs';
import { config } from '../config/config';
const { Op } = require('sequelize');

export class BehaviorAnalyticsEngine {
  async analyzeEvent(event: any) {
    try {
      const userProfile = await UserProfile.findByPk(event.userId);
      if (!userProfile) {
        return { riskScore: 0.5, anomalies: [] };
      }

      const anomalies: string[] = [];
      let riskScore = 0;

      // Check for off-hours access
      const hour = dayjs(event.timestamp).hour();
      const [startHour, endHour] = userProfile.normalHoursOfAccess;
      if (hour < startHour || hour > endHour) {
        anomalies.push('off_hours_access');
        riskScore += 0.3;
      }

      // Check for unusual location
      if (
        userProfile.commonLocations.length > 0 &&
        !userProfile.commonLocations.includes(event.sourceIp)
      ) {
        anomalies.push('unusual_location');
        riskScore += 0.4;
      }

      // Check for unusual resource access
      if (
        userProfile.typicalResources.length > 0 &&
        !userProfile.typicalResources.includes(event.resource)
      ) {
        anomalies.push('unusual_resource');
        riskScore += 0.3;
      }

      // Check for suspicious actions
      if (
        event.action === 'sudo rm -rf' ||
        event.action.includes('delete') ||
        event.action.includes('execute')
      ) {
        anomalies.push('suspicious_action');
        riskScore += 0.5;
      }

      // Check for repeated failures
      const recentFailures = await EventLog.count({
        where: {
          userId: event.userId,
          result: 'failure',
          timestamp: {
            [Op.gte]: dayjs().subtract(1, 'hour').toDate(),
          },
        },
      });

      if (recentFailures > 5) {
        anomalies.push('repeated_failures');
        riskScore += 0.6;
      }

      // Normalize risk score
      riskScore = Math.min(riskScore, 1.0);

      return { riskScore, anomalies };
    } catch (error) {
      logger.error(`Failed to analyze event: ${error}`);
      throw error;
    }
  }

  async buildUserBaseline(userId: string) {
    try {
      const baselineWindowDays = config.analytics.baselineWindowDays;
      const fromTime = dayjs()
        .subtract(baselineWindowDays, 'days')
        .toDate();

      const events = await EventLog.findAll({
        where: {
          userId,
          timestamp: {
            [Op.gte]: fromTime,
          },
        },
      });

      if (events.length === 0) {
        logger.warn(`No events found for user ${userId}`);
        return null;
      }

      // Calculate common locations
      const locationCounts: Record<string, number> = {};
      events.forEach((event) => {
        locationCounts[event.sourceIp] =
          (locationCounts[event.sourceIp] || 0) + 1;
      });
      const commonLocations = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([loc]) => loc);

      // Calculate typical resources
      const resourceCounts: Record<string, number> = {};
      events.forEach((event) => {
        resourceCounts[event.resource] =
          (resourceCounts[event.resource] || 0) + 1;
      });
      const typicalResources = Object.entries(resourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([res]) => res);

      // Calculate average login time
      const loginTimes = events
        .filter((e) => e.eventType === 'authentication' && e.result === 'success')
        .map((e) => dayjs(e.timestamp).hour());
      const avgLoginTime =
        loginTimes.length > 0
          ? loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length
          : 9;

      // Upsert user profile
      const [profile] = await UserProfile.upsert(
        {
          userId,
          avgLoginTime,
          commonLocations,
          typicalResources,
          normalHoursOfAccess: [Math.floor(avgLoginTime) - 1, Math.floor(avgLoginTime) + 9],
          baselineEvents: events.length,
          lastUpdated: new Date(),
        },
        { returning: true }
      );

      logger.info(`Baseline built for user ${userId}`);
      return profile;
    } catch (error) {
      logger.error(`Failed to build baseline for user ${userId}: ${error}`);
      throw error;
    }
  }
}
