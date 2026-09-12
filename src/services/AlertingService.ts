import AnomalyAlert from '../models/AnomalyAlert';
import EventLog from '../models/EventLog';
import logger from '../config/logger';
import { config } from '../config/config';
const { Op } = require('sequelize');

export class AlertingService {
  async createAlert(
    userId: string,
    eventId: string,
    anomalyType: string,
    riskScore: number,
    description: string
  ) {
    try {
      const severity =
        riskScore > 0.9
          ? 'critical'
          : riskScore > 0.7
          ? 'high'
          : riskScore > 0.5
          ? 'medium'
          : 'low';

      const alert = await AnomalyAlert.create({
        userId,
        eventId,
        anomalyType,
        riskScore,
        description,
        severity,
        status: 'open',
      });

      logger.info(
        `Alert created: ${alert.id} for user ${userId} with severity ${severity}`
      );
      return alert;
    } catch (error) {
      logger.error(`Failed to create alert: ${error}`);
      throw error;
    }
  }

  async getAlerts(
    status?: string,
    severity?: string,
    hoursBack: number = 24
  ) {
    try {
      const where: any = {
        createdAt: {
          [Op.gte]: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
        },
      };

      if (status) where.status = status;
      if (severity) where.severity = severity;

      const alerts = await AnomalyAlert.findAll({
        where,
        include: [
          {
            model: EventLog,
            as: 'eventLog',
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return alerts;
    } catch (error) {
      logger.error(`Failed to get alerts: ${error}`);
      throw error;
    }
  }

  async updateAlertStatus(alertId: string, status: string) {
    try {
      const alert = await AnomalyAlert.findByPk(alertId);
      if (!alert) throw new Error(`Alert ${alertId} not found`);

      alert.status = status as any;
      if (status === 'resolved') {
        alert.resolvedAt = new Date();
      }
      await alert.save();

      logger.info(`Alert ${alertId} status updated to ${status}`);
      return alert;
    } catch (error) {
      logger.error(`Failed to update alert: ${error}`);
      throw error;
    }
  }

  async getCriticalAlerts() {
    try {
      const alerts = await AnomalyAlert.findAll({
        where: {
          severity: 'critical',
          status: 'open',
        },
        order: [['createdAt', 'DESC']],
      });
      return alerts;
    } catch (error) {
      logger.error(`Failed to get critical alerts: ${error}`);
      throw error;
    }
  }
}
