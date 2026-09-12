import express, { Request, Response } from 'express';
import AnomalyAlert from '../models/AnomalyAlert';
import EventLog from '../models/EventLog';
import UserProfile from '../models/UserProfile';
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;
    const fromTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const totalEvents = await EventLog.count({
      where: {
        timestamp: {
          [Op.gte]: fromTime,
        },
      },
    });

    const totalAlerts = await AnomalyAlert.count({
      where: {
        createdAt: {
          [Op.gte]: fromTime,
        },
      },
    });

    const openAlerts = await AnomalyAlert.count({
      where: {
        status: 'open',
      },
    });

    const criticalAlerts = await AnomalyAlert.count({
      where: {
        severity: 'critical',
        status: 'open',
      },
    });

    const activeUsers = await EventLog.count({
      distinct: true,
      col: 'userId',
      where: {
        timestamp: {
          [Op.gte]: fromTime,
        },
      },
    });

    res.json({
      totalEvents,
      totalAlerts,
      openAlerts,
      criticalAlerts,
      activeUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get events timeline
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;
    const fromTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const events = await EventLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: fromTime,
        },
      },
      order: [['timestamp', 'DESC']],
      limit: 50,
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

// Get risk distribution
router.get('/risk-distribution', async (req: Request, res: Response) => {
  try {
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;
    const fromTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const distribution = await AnomalyAlert.findAll({
      attributes: ['severity', ['COUNT(*)', 'count']],
      where: {
        createdAt: {
          [Op.gte]: fromTime,
        },
      },
      group: ['severity'],
      raw: true,
    });

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get risk distribution' });
  }
});

export default router;
