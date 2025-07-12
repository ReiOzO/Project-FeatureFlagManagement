const AWS = require('aws-sdk');
const { handleApiError } = require('../utils/errorHandler');
const { sendMetric } = require('../services/aws');

// Initialize AWS clients
const appConfig = new AWS.AppConfig({ region: process.env.AWS_REGION });
const cloudWatch = new AWS.CloudWatch({ region: process.env.AWS_REGION });
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION });

/**
 * Get AWS AppConfig Applications
 */
const getAppConfigApplications = async (req, res) => {
  try {
    const params = {
      MaxResults: 50
    };

    const result = await appConfig.listApplications(params).promise();
    
    const applications = result.Items.map(app => ({
      id: app.Id,
      name: app.Name,
      description: app.Description,
      createdAt: app.CreatedAt,
      lastUpdatedAt: app.LastUpdatedAt
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'ListApplications' }
    ]);

    res.json({
      success: true,
      data: {
        applications,
        total: applications.length
      }
    });
  } catch (error) {
    console.error('Error getting AppConfig applications:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get AWS AppConfig Environments
 */
const getAppConfigEnvironments = async (req, res) => {
  try {
    const { appId } = req.params;
    
    const params = {
      ApplicationId: appId,
      MaxResults: 50
    };

    const result = await appConfig.listEnvironments(params).promise();
    
    const environments = result.Items.map(env => ({
      id: env.Id,
      name: env.Name,
      description: env.Description,
      state: env.State,
      monitors: env.Monitors || [],
      createdAt: env.CreatedAt,
      lastUpdatedAt: env.LastUpdatedAt
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'ListEnvironments' }
    ]);

    res.json({
      success: true,
      data: {
        environments,
        total: environments.length
      }
    });
  } catch (error) {
    console.error('Error getting AppConfig environments:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get AWS AppConfig Configuration Profiles
 */
const getAppConfigProfiles = async (req, res) => {
  try {
    const { appId } = req.params;
    
    const params = {
      ApplicationId: appId,
      MaxResults: 50
    };

    const result = await appConfig.listConfigurationProfiles(params).promise();
    
    const profiles = result.Items.map(profile => ({
      id: profile.Id,
      name: profile.Name,
      description: profile.Description,
      locationUri: profile.LocationUri,
      type: profile.Type,
      validators: profile.Validators || [],
      createdAt: profile.CreatedAt,
      lastUpdatedAt: profile.LastUpdatedAt
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'ListConfigurationProfiles' }
    ]);

    res.json({
      success: true,
      data: {
        profiles,
        total: profiles.length
      }
    });
  } catch (error) {
    console.error('Error getting AppConfig profiles:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get AWS AppConfig Deployments
 */
const getAppConfigDeployments = async (req, res) => {
  try {
    const { appId, envId } = req.params;
    
    const params = {
      ApplicationId: appId,
      EnvironmentId: envId,
      MaxResults: 50
    };

    const result = await appConfig.listDeployments(params).promise();
    
    const deployments = result.Items.map(deployment => ({
      id: deployment.DeploymentNumber,
      applicationId: deployment.ApplicationId,
      environmentId: deployment.EnvironmentId,
      configurationProfileId: deployment.ConfigurationProfileId,
      configurationVersion: deployment.ConfigurationVersion,
      description: deployment.Description,
      deploymentStrategyId: deployment.DeploymentStrategyId,
      state: deployment.State,
      eventLog: deployment.EventLog || [],
      percentageComplete: deployment.PercentageComplete,
      startedAt: deployment.StartedAt,
      completedAt: deployment.CompletedAt
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'ListDeployments' }
    ]);

    res.json({
      success: true,
      data: {
        deployments,
        total: deployments.length
      }
    });
  } catch (error) {
    console.error('Error getting AppConfig deployments:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Create AWS AppConfig Deployment
 */
const createAppConfigDeployment = async (req, res) => {
  try {
    const { appId, envId } = req.params;
    const { 
      configurationProfileId, 
      configurationVersion, 
      deploymentStrategyId, 
      description 
    } = req.body;

    const params = {
      ApplicationId: appId,
      EnvironmentId: envId,
      ConfigurationProfileId: configurationProfileId,
      ConfigurationVersion: configurationVersion,
      DeploymentStrategyId: deploymentStrategyId || 'AppConfig.Linear20PercentEvery6Minutes',
      Description: description || 'Deployment from dashboard'
    };

    const result = await appConfig.startDeployment(params).promise();

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'StartDeployment' }
    ]);

    res.json({
      success: true,
      message: 'Deployment started successfully',
      data: {
        deploymentNumber: result.DeploymentNumber,
        state: result.State,
        description: result.Description
      }
    });
  } catch (error) {
    console.error('Error creating AppConfig deployment:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Stop AWS AppConfig Deployment
 */
const stopAppConfigDeployment = async (req, res) => {
  try {
    const { appId, envId, deploymentNumber } = req.params;

    const params = {
      ApplicationId: appId,
      EnvironmentId: envId,
      DeploymentNumber: parseInt(deploymentNumber)
    };

    const result = await appConfig.stopDeployment(params).promise();

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'StopDeployment' }
    ]);

    res.json({
      success: true,
      message: 'Deployment stopped successfully',
      data: {
        deploymentNumber: result.DeploymentNumber,
        state: result.State
      }
    });
  } catch (error) {
    console.error('Error stopping AppConfig deployment:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get CloudWatch Metrics
 */
const getCloudWatchMetrics = async (req, res) => {
  try {
    const { 
      namespace = 'FeatureFlags',
      metricName = 'ApiRequests',
      startTime,
      endTime,
      period = 300 
    } = req.query;

    const params = {
      Namespace: namespace,
      MetricName: metricName,
      StartTime: startTime ? new Date(startTime) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      EndTime: endTime ? new Date(endTime) : new Date(),
      Period: parseInt(period),
      Statistics: ['Sum', 'Average', 'Maximum']
    };

    const result = await cloudWatch.getMetricStatistics(params).promise();

    const metrics = result.Datapoints.map(point => ({
      timestamp: point.Timestamp,
      sum: point.Sum,
      average: point.Average,
      maximum: point.Maximum
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'GetMetricStatistics' }
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        total: metrics.length,
        namespace,
        metricName,
        period
      }
    });
  } catch (error) {
    console.error('Error getting CloudWatch metrics:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get CloudWatch Alarms
 */
const getCloudWatchAlarms = async (req, res) => {
  try {
    const { stateValue, actionPrefix } = req.query;
    
    const params = {
      MaxResults: 100
    };

    if (stateValue) {
      params.StateValue = stateValue;
    }

    if (actionPrefix) {
      params.ActionPrefix = actionPrefix;
    }

    const result = await cloudWatch.describeAlarms(params).promise();

    const alarms = result.MetricAlarms.map(alarm => ({
      name: alarm.AlarmName,
      description: alarm.AlarmDescription,
      metricName: alarm.MetricName,
      namespace: alarm.Namespace,
      statistic: alarm.Statistic,
      threshold: alarm.Threshold,
      comparisonOperator: alarm.ComparisonOperator,
      state: alarm.StateValue,
      stateReason: alarm.StateReason,
      actions: alarm.AlarmActions,
      createdAt: alarm.AlarmConfigurationUpdatedTimestamp
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'DescribeAlarms' }
    ]);

    res.json({
      success: true,
      data: {
        alarms,
        total: alarms.length
      }
    });
  } catch (error) {
    console.error('Error getting CloudWatch alarms:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get Lambda Functions
 */
const getLambdaFunctions = async (req, res) => {
  try {
    const params = {
      MaxResults: 50
    };

    const result = await lambda.listFunctions(params).promise();

    const functions = result.Functions.map(func => ({
      name: func.FunctionName,
      description: func.Description,
      runtime: func.Runtime,
      handler: func.Handler,
      role: func.Role,
      codeSize: func.CodeSize,
      timeout: func.Timeout,
      memorySize: func.MemorySize,
      lastModified: func.LastModified,
      state: func.State,
      version: func.Version
    }));

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'ListFunctions' }
    ]);

    res.json({
      success: true,
      data: {
        functions,
        total: functions.length
      }
    });
  } catch (error) {
    console.error('Error getting Lambda functions:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Invoke Lambda Function
 */
const invokeLambdaFunction = async (req, res) => {
  try {
    const { functionName } = req.params;
    const { payload } = req.body;

    const params = {
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload || {})
    };

    const result = await lambda.invoke(params).promise();

    let responsePayload = {};
    if (result.Payload) {
      try {
        responsePayload = JSON.parse(result.Payload.toString());
      } catch (e) {
        responsePayload = { raw: result.Payload.toString() };
      }
    }

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'InvokeFunction' }
    ]);

    res.json({
      success: true,
      message: 'Lambda function invoked successfully',
      data: {
        statusCode: result.StatusCode,
        executedVersion: result.ExecutedVersion,
        payload: responsePayload
      }
    });
  } catch (error) {
    console.error('Error invoking Lambda function:', error);
    res.status(500).json(handleApiError(error));
  }
};

/**
 * Get AWS Resource Summary
 */
const getAWSResourceSummary = async (req, res) => {
  try {
    const [applications, alarms, functions] = await Promise.all([
      appConfig.listApplications({ MaxResults: 10 }).promise(),
      cloudWatch.describeAlarms({ MaxResults: 10 }).promise(),
      lambda.listFunctions({ MaxResults: 10 }).promise()
    ]);

    const summary = {
      appConfig: {
        applications: applications.Items.length,
        totalApplications: applications.Items.length
      },
      cloudWatch: {
        alarms: alarms.MetricAlarms.length,
        activeAlarms: alarms.MetricAlarms.filter(a => a.StateValue === 'ALARM').length,
        okAlarms: alarms.MetricAlarms.filter(a => a.StateValue === 'OK').length
      },
      lambda: {
        functions: functions.Functions.length,
        totalFunctions: functions.Functions.length
      }
    };

    await sendMetric('AWSConsoleInteraction', 1, 'Count', [
      { Name: 'Action', Value: 'GetResourceSummary' }
    ]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting AWS resource summary:', error);
    res.status(500).json(handleApiError(error));
  }
};

module.exports = {
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
}; 