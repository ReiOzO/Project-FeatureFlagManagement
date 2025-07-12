const express = require('express');
const router = express.Router();
const { getCurrentMetrics, getMetricsData } = require('../services/metrics');
const { getMetrics } = require('../services/aws');

/**
 * GET /api/metrics
 * Get current application metrics (include CloudWatch)
 */
router.get('/', async (req, res) => {
  try {
    const metrics = await getMetricsData();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/metrics/cloudwatch
 * Get CloudWatch metrics
 */
router.get('/cloudwatch', async (req, res) => {
  try {
    const { 
      metricName = 'TotalRequests',
      startTime,
      endTime,
      period = 300 
    } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        message: 'startTime and endTime are required'
      });
    }

    const metrics = await getMetrics(
      metricName,
      new Date(startTime),
      new Date(endTime),
      parseInt(period)
    );

    res.json({
      success: true,
      data: {
        metricName,
        metrics,
        period: parseInt(period),
        startTime,
        endTime
      }
    });
  } catch (error) {
    console.error('Error getting CloudWatch metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CloudWatch metrics',
      message: error.message
    });
  }
});

module.exports = router; 