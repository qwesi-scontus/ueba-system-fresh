import express, { Request, Response } from 'express';
import { DataPipeline } from '../services/DataPipeline';
import { BehaviorAnalyticsEngine } from '../services/BehaviorAnalyticsEngine';
import { AlertingService } from '../services/AlertingService';
import logger from '../config/logger';

const router = express.Router();
const dataPipeline = new DataPipeline();
const analyticsEngine = new BehaviorAnalyticsEngine();
const alertingService = new AlertingService();

// Ingest event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const event = await dataPipeline.ingestEvent(req.body);

    // Analyze event for anomalies
    const analysis = await analyticsEngine.analyzeEvent(event);

    // Create alert if risk score exceeds threshold
    if (analysis.riskScore > 0.6) {
      const alert = await alertingService.createAlert(
        event.userId,
        event.id,
        analysis.anomalies.join(','),
        analysis.riskScore,
        `Anomalous behavior detected: ${analysis.anomalies.join(', ')}`
      );
      res.json({ event, alert, analysis });
    } else {
      res.json({ event, analysis });
    }
  } catch (error) {
    logger.error(`POST /events failed: ${error}`);
    res.status(500).json({ error: 'Failed to ingest event' });
  }
});

// Get events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const events = await dataPipeline.getAllEvents(limit, offset);
    res.json(events);
  } catch (error) {
    logger.error(`GET /events failed: ${error}`);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get events for user
router.get('/events/:userId', async (req: Request, res: Response) => {
  try {
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;
    const events = await dataPipeline.getEventsForUser(
      req.params.userId,
      hoursBack
    );
    res.json(events);
  } catch (error) {
    logger.error(`GET /events/:userId failed: ${error}`);
    res.status(500).json({ error: 'Failed to get user events' });
  }
});

// Get alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const severity = req.query.severity as string;
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;
    const alerts = await alertingService.getAlerts(
      status,
      severity,
      hoursBack
    );
    res.json(alerts);
  } catch (error) {
    logger.error(`GET /alerts failed: ${error}`);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Get critical alerts
router.get('/alerts/critical/list', async (req: Request, res: Response) => {
  try {
    const alerts = await alertingService.getCriticalAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error(`GET /alerts/critical/list failed: ${error}`);
    res.status(500).json({ error: 'Failed to get critical alerts' });
  }
});

// Update alert status
router.patch('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const alert = await alertingService.updateAlertStatus(
      req.params.id,
      status
    );
    res.json(alert);
  } catch (error) {
    logger.error(`PATCH /alerts/:id failed: ${error}`);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
