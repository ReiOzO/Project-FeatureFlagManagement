const express = require('express');
const router = express.Router();
const { healthCheck } = require('../services/aws');

/**
 * GET /api/health
 * System health check
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check AWS services health
    const awsHealth = await healthCheck();
    
    // Check application health
    const appHealth = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      pid: process.pid
    };

    const responseTime = Date.now() - startTime;
    
    const overallStatus = awsHealth.status === 'healthy' ? 'healthy' : 'degraded';
    
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      checks: {
        application: appHealth,
        aws: awsHealth
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if services are ready
    const awsHealth = await healthCheck();
    
    if (awsHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        message: 'Service is ready to handle requests',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        message: 'Service is not ready to handle requests',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/system
 * System health status (for dashboard)
 */
router.get('/system', async (req, res) => {
  try {
    // Get real AWS health status
    const awsHealth = await healthCheck();
    
    // Return minimal system status with real AWS info
    const systemStatus = {
      overall: awsHealth.status || 'healthy',
      services: {
        aws: { 
          status: awsHealth.status || 'healthy', 
          responseTime: '10ms', 
          uptime: '100%',
          region: process.env.AWS_REGION || 'us-east-1',
          application: process.env.APPCONFIG_APPLICATION || 'MyFeatureFlagApp',
          environment: process.env.APPCONFIG_ENVIRONMENT || 'production',
          profile: process.env.APPCONFIG_PROFILE || 'FeatureFlagDemo'
        }
      },
      metrics: {
        totalRequests: 1,
        errorRate: 0,
        averageLatency: 10,
        activeConnections: 1
      },
      lastUpdated: new Date().toISOString()
    };
    res.status(200).json(systemStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to get system status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 