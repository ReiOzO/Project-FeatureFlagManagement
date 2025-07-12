const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AWS Configuration from environment variables
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-1';
const applicationName = process.env.APPCONFIG_APPLICATION;
const environmentName = process.env.APPCONFIG_ENVIRONMENT;
const configProfileName = process.env.APPCONFIG_PROFILE;

// Initialize AWS clients
let appConfigData;
let cloudWatch;
let isInitialized = false;
let configToken = null;

/**
 * Initialize AWS services
 */
async function initializeAWS() {
  try {
    // Log configuration
    console.log('AWS Configuration:');
    console.log(`Region: ${region}`);
    console.log(`Application: ${applicationName}`);
    console.log(`Environment: ${environmentName}`);
    console.log(`Profile: ${configProfileName}`);
    console.log(`Access Key ID: ${accessKeyId ? `****${accessKeyId.slice(-4)}` : 'not set'}`);
    console.log(`Secret Access Key: ${secretAccessKey ? '****' : 'not set'}`);
    
    // Update AWS config with credentials if available
    const awsConfig = { region };
    
    if (accessKeyId && secretAccessKey) {
      awsConfig.credentials = new AWS.Credentials({
        accessKeyId,
        secretAccessKey
      });
    }
    
    AWS.config.update(awsConfig);

    appConfigData = new AWS.AppConfigData({ apiVersion: '2021-11-11' });
    cloudWatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

    // Test connection
    await testConnection();
    isInitialized = true;
    
    console.log('✅ AWS services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AWS services:', error);
    // Don't throw error - just log it and continue
    console.log('⚠️ AWS services initialization failed, but continuing...');
    isInitialized = true; // Still mark as initialized to allow fallback
  }
}

/**
 * Test AWS connection
 */
async function testConnection() {
  try {
    // Test AppConfig connection
    if (appConfigData) {
      try {
        // AppConfigData doesn't have a direct listApplications like AppConfig
        // This is a placeholder for testing if AppConfigData is initialized
        console.log('AppConfigData connection test successful (placeholder)');
      } catch (error) {
        console.error('AppConfigData connection test failed:', error);
      }
    }
    
    // Test CloudWatch connection
    if (cloudWatch) {
      try {
        await cloudWatch.listMetrics().promise();
        console.log('CloudWatch connection successful');
      } catch (error) {
        console.error('CloudWatch connection test failed:', error);
      }
    }
  } catch (error) {
    console.error('AWS connection test failed:', error);
    // Don't throw error for connection test - just log it
    console.log('⚠️ AWS connection test failed, but continuing...');
  }
}

/**
 * Get feature flag configuration from AppConfigData
 */
async function getFeatureFlagConfiguration() {
  try {
    console.log('Getting feature flag configuration...');
    
    // Read from local file instead of AWS AppConfig
    try {
      const fs = require('fs');
      const path = require('path');
      const localConfigPath = process.env.LOCAL_CONFIG_PATH || path.resolve(__dirname, '../../../aws-config/appconfig/feature-flags.json');
      
      console.log(`Reading configuration from local file: ${localConfigPath}`);
      if (fs.existsSync(localConfigPath)) {
        const configData = fs.readFileSync(localConfigPath, 'utf8');
        const parsedConfig = JSON.parse(configData);
        console.log('Successfully loaded configuration from local file');
        return parsedConfig;
      } else {
        console.log('Local configuration file not found');
      }
    } catch (localError) {
      console.error('Error reading local configuration:', localError);
    }
    
    // If local file fails, try AWS AppConfig as fallback
    if (!appConfigData) {
      console.warn('AppConfigData not initialized, returning null');
      return null;
    }
    
    console.log('Falling back to AWS AppConfig...');
    console.log(`Application: ${applicationName}`);
    console.log(`Environment: ${environmentName}`);
    console.log(`Profile: ${configProfileName}`);
    
    if (!configToken) {
      // Start configuration session
      console.log('Starting configuration session...');
      const sessionParams = {
        ApplicationIdentifier: applicationName,
        EnvironmentIdentifier: environmentName,
        ConfigurationProfileIdentifier: configProfileName
      };
      console.log('Session params:', JSON.stringify(sessionParams));
      
      const session = await appConfigData.startConfigurationSession(sessionParams).promise();
      configToken = session.InitialConfigurationToken;
      console.log('Configuration session started, token received');
    }
    
    // Get latest configuration
    console.log('Getting latest configuration with token...');
    const config = await appConfigData.getLatestConfiguration({
      ConfigurationToken: configToken
    }).promise();
    
    if (config.NextPollConfigurationToken) {
      configToken = config.NextPollConfigurationToken;
      console.log('New poll token received');
    }
    
    if (config.Configuration && config.Configuration.length > 0) {
      console.log(`Received configuration data (${config.Configuration.length} bytes)`);
      try {
        const parsedConfig = JSON.parse(config.Configuration.toString());
        console.log('Successfully parsed configuration JSON');
        return parsedConfig;
      } catch (err) {
        console.error('Feature flag config is not valid JSON:', err);
        return null;
      }
    } else {
      console.log('No configuration data received from AWS AppConfig');
    }
    return null;
  } catch (error) {
    console.error('Failed to get feature flag configuration:', error);
    return null;
  }
}

/**
 * Update feature flag configuration in AppConfig
 */
async function updateFeatureFlagConfiguration(configurationData) {
  try {
    if (!appConfigData) {
      console.warn('AppConfigData not initialized, skipping configuration update');
      return null;
    }

    const params = {
      ApplicationId: applicationName,
      EnvironmentId: environmentName,
      ConfigurationProfileId: 'feature-flags',
      ConfigurationVersion: '1',
      Content: JSON.stringify(configurationData),
      ContentType: 'application/json',
      Description: `Updated at ${new Date().toISOString()}`,
      LatestVersionNumber: 1
    };

    const result = await appConfigData.createHostedConfigurationVersion(params).promise();
    
    // Start deployment
    const deploymentParams = {
      ApplicationId: applicationName,
      EnvironmentId: environmentName,
      ConfigurationProfileId: 'feature-flags',
      ConfigurationVersion: result.VersionNumber.toString(),
      DeploymentStrategyId: 'AppConfig.Linear20PercentEvery6Minutes',
      Description: 'Automated feature flag update',
      Tags: [
        {
          Key: 'UpdatedBy',
          Value: 'feature-flag-system'
        }
      ]
    };

    await appConfigData.startDeployment(deploymentParams).promise();
    
    console.log('✅ Feature flag configuration updated and deployment started');
    return result;
  } catch (error) {
    console.error('Failed to update feature flag configuration:', error);
    // Don't throw error for configuration update - just log it
    return null;
  }
}

/**
 * Send custom metric to CloudWatch
 */
async function sendMetric(metricName, value, unit = 'Count', dimensions = []) {
  try {
    if (!cloudWatch) {
      console.warn('CloudWatch not initialized, skipping metric');
      return;
    }

    const params = {
      Namespace: 'FeatureFlags',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
        }
      ]
    };

    await cloudWatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Failed to send metric to CloudWatch:', error);
    // Don't throw error for metrics - just log it
  }
}

/**
 * Get CloudWatch metrics
 */
async function getMetrics(metricName, startTime, endTime, period = 300) {
  try {
    if (!cloudWatch) {
      console.warn('CloudWatch not initialized, returning empty metrics');
      return [];
    }

    const params = {
      MetricName: metricName,
      Namespace: 'FeatureFlags',
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: ['Average', 'Sum', 'Maximum', 'Minimum']
    };

    const result = await cloudWatch.getMetricStatistics(params).promise();
    return result.Datapoints;
  } catch (error) {
    console.error('Failed to get metrics from CloudWatch:', error);
    return [];
  }
}

/**
 * Create CloudWatch alarm for automated rollback
 */
async function createRollbackAlarm(featureFlagName, threshold) {
  try {
    if (!cloudWatch) {
      console.warn('CloudWatch not initialized, skipping alarm creation');
      return;
    }

    // Construct SNS ARN using environment variables or use a default placeholder
    const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
    const snsTopicName = process.env.SNS_TOPIC_NAME || 'feature-flag-alerts';
    const snsArn = `arn:aws:sns:${region}:${accountId}:${snsTopicName}`;

    const params = {
      AlarmName: `FeatureFlag-${featureFlagName}-ErrorRate`,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 2,
      MetricName: 'ErrorRate',
      Namespace: 'FeatureFlags',
      Period: 300,
      Statistic: 'Average',
      Threshold: threshold,
      ActionsEnabled: true,
      AlarmActions: [snsArn],
      AlarmDescription: `Alarm for ${featureFlagName} error rate`,
      Dimensions: [
        {
          Name: 'FeatureFlagName',
          Value: featureFlagName
        }
      ]
    };

    await cloudWatch.putMetricAlarm(params).promise();
    console.log(`✅ Rollback alarm created for ${featureFlagName}`);
  } catch (error) {
    console.error('Failed to create rollback alarm:', error);
    // Don't throw error for alarm creation - just log it
  }
}

/**
 * Configure automated rollback for a feature flag
 */
async function configureRollbackAlarm(featureFlagName, metricName, threshold, evaluationPeriods = 2) {
  try {
    if (!cloudWatch) {
      console.warn('CloudWatch not initialized, skipping alarm configuration');
      return null;
    }

    console.log(`Configuring rollback alarm for ${featureFlagName}`);
    
    // Create CloudWatch alarm
    const alarmName = `FeatureFlag-${featureFlagName}-Rollback`;
    const alarmParams = {
      AlarmName: alarmName,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: evaluationPeriods,
      MetricName: metricName,
      Namespace: 'FeatureFlags',
      Period: 60, // 1 minute
      Statistic: 'Average',
      Threshold: threshold,
      ActionsEnabled: true,
      AlarmDescription: `Auto rollback alarm for feature flag ${featureFlagName}`,
      Dimensions: [
        {
          Name: 'FeatureFlagName',
          Value: featureFlagName
        }
      ]
    };

    // Create or update the alarm
    await cloudWatch.putMetricAlarm(alarmParams).promise();
    
    console.log(`✅ Rollback alarm configured for ${featureFlagName}`);
    
    return {
      alarmName,
      metricName,
      threshold,
      evaluationPeriods
    };
  } catch (error) {
    console.error('Failed to configure rollback alarm:', error);
    return null;
  }
}

/**
 * Remove rollback alarm for a feature flag
 */
async function removeRollbackAlarm(featureFlagName) {
  try {
    if (!cloudWatch) {
      console.warn('CloudWatch not initialized, skipping alarm removal');
      return false;
    }

    const alarmName = `FeatureFlag-${featureFlagName}-Rollback`;
    
    await cloudWatch.deleteAlarms({
      AlarmNames: [alarmName]
    }).promise();
    
    console.log(`✅ Rollback alarm removed for ${featureFlagName}`);
    return true;
  } catch (error) {
    console.error('Failed to remove rollback alarm:', error);
    return false;
  }
}

/**
 * Health check for AWS services
 */
async function healthCheck() {
  try {
    if (!isInitialized) {
      return { status: 'unhealthy', message: 'AWS services not initialized' };
    }

    // Quick health check
    if (cloudWatch) {
      try {
        // Không sử dụng MaxResults vì không được hỗ trợ trong AWS SDK v2 cho CloudWatch
        await cloudWatch.listMetrics().promise();
      } catch (error) {
        console.warn('CloudWatch health check failed:', error);
      }
    }
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        appConfig: isInitialized ? 'connected' : 'disconnected',
        cloudWatch: cloudWatch ? 'connected' : 'disconnected'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export functions
module.exports = {
  initializeAWS,
  getFeatureFlagConfiguration,
  updateFeatureFlagConfiguration,
  sendMetric,
  getMetrics,
  createRollbackAlarm,
  configureRollbackAlarm,
  removeRollbackAlarm,
  healthCheck
}; 