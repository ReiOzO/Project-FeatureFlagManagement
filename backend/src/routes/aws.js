const express = require('express');
const router = express.Router();
const {
  getAppConfigApplications,
  getAppConfigEnvironments,
  getAppConfigProfiles,
  getAppConfigDeployments,
  createAppConfigDeployment,
  stopAppConfigDeployment,
  getCloudWatchMetrics,
  getCloudWatchAlarms,
  getLambdaFunctions,
  invokeLambdaFunction,
  getAWSResourceSummary
} = require('../controllers/awsController');

// AWS AppConfig routes
router.get('/appconfig/applications', getAppConfigApplications);
router.get('/appconfig/applications/:appId/environments', getAppConfigEnvironments);
router.get('/appconfig/applications/:appId/profiles', getAppConfigProfiles);
router.get('/appconfig/applications/:appId/environments/:envId/deployments', getAppConfigDeployments);
router.post('/appconfig/applications/:appId/environments/:envId/deployments', createAppConfigDeployment);
router.post('/appconfig/applications/:appId/environments/:envId/deployments/:deploymentNumber/stop', stopAppConfigDeployment);

// CloudWatch routes
router.get('/cloudwatch/metrics', getCloudWatchMetrics);
router.get('/cloudwatch/alarms', getCloudWatchAlarms);

// Lambda routes
router.get('/lambda/functions', getLambdaFunctions);
router.post('/lambda/functions/:functionName/invoke', invokeLambdaFunction);

// General AWS routes
router.get('/resources/summary', getAWSResourceSummary);

module.exports = router; 