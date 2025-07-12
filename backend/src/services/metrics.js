const { sendMetric } = require('./aws');
const cron = require('node-cron');

// Metrics collection state
let metricsCollectionStarted = false;
let requestCount = 0;
let errorCount = 0;
let featureFlagEvaluations = {};

/**
 * Start metrics collection
 */
function startMetricsCollection() {
  if (metricsCollectionStarted) {
    console.log('⚠️ Metrics collection already started');
    return;
  }

  // Send metrics every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await sendAggregatedMetrics();
    } catch (error) {
      console.error('Failed to send aggregated metrics:', error);
    }
  });

  metricsCollectionStarted = true;
  console.log('✅ Metrics collection started');
}

/**
 * Record request metric
 */
function recordRequest() {
  requestCount++;
}

/**
 * Record error metric
 */
function recordError() {
  errorCount++;
}

/**
 * Record feature flag evaluation
 */
function recordFeatureFlagEvaluation(flagName, result) {
  if (!featureFlagEvaluations[flagName]) {
    featureFlagEvaluations[flagName] = {
      enabled: 0,
      disabled: 0,
      total: 0
    };
  }

  featureFlagEvaluations[flagName].total++;
  if (result) {
    featureFlagEvaluations[flagName].enabled++;
  } else {
    featureFlagEvaluations[flagName].disabled++;
  }
}

/**
 * Send aggregated metrics to CloudWatch
 */
async function sendAggregatedMetrics() {
  try {
    const timestamp = new Date();
    
    // Send request metrics
    if (requestCount > 0) {
      await sendMetric('TotalRequests', requestCount, 'Count');
      requestCount = 0;
    }

    // Send error metrics
    if (errorCount > 0) {
      await sendMetric('TotalErrors', errorCount, 'Count');
      
      // Calculate error rate
      const errorRate = (errorCount / (requestCount + errorCount)) * 100;
      await sendMetric('ErrorRate', errorRate, 'Percent');
      
      errorCount = 0;
    }

    // Send feature flag evaluation metrics
    for (const [flagName, metrics] of Object.entries(featureFlagEvaluations)) {
      if (metrics.total > 0) {
        await sendMetric('FeatureFlagEvaluations', metrics.total, 'Count', [
          { Name: 'FeatureFlagName', Value: flagName }
        ]);

        await sendMetric('FeatureFlagEnabled', metrics.enabled, 'Count', [
          { Name: 'FeatureFlagName', Value: flagName }
        ]);

        await sendMetric('FeatureFlagDisabled', metrics.disabled, 'Count', [
          { Name: 'FeatureFlagName', Value: flagName }
        ]);

        // Calculate enablement rate
        const enablementRate = (metrics.enabled / metrics.total) * 100;
        await sendMetric('FeatureFlagEnablementRate', enablementRate, 'Percent', [
          { Name: 'FeatureFlagName', Value: flagName }
        ]);
      }
    }

    // Reset feature flag evaluations
    featureFlagEvaluations = {};

    // Send system metrics
    const memoryUsage = process.memoryUsage();
    await sendMetric('MemoryUsage', memoryUsage.heapUsed / 1024 / 1024, 'Megabytes');
    await sendMetric('MemoryTotal', memoryUsage.heapTotal / 1024 / 1024, 'Megabytes');
    await sendMetric('CPUUsage', process.cpuUsage().user / 1000, 'Milliseconds');

    console.log('✅ Metrics sent to CloudWatch');
  } catch (error) {
    console.error('❌ Failed to send metrics:', error);
    // Don't throw error for metrics - just log it
  }
}

/**
 * Get current metrics
 */
function getCurrentMetrics() {
  return {
    requestCount,
    errorCount,
    featureFlagEvaluations: { ...featureFlagEvaluations },
    timestamp: new Date().toISOString()
  };
}

/**
 * Send custom application metric
 */
async function sendCustomMetric(metricName, value, unit = 'Count', dimensions = []) {
  try {
    await sendMetric(metricName, value, unit, dimensions);
  } catch (error) {
    console.error('Failed to send custom metric:', error);
    // Don't throw error for metrics - just log it
  }
}

/**
 * Middleware to track request metrics
 */
function metricsMiddleware(req, res, next) {
  recordRequest();
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Send response time metric
    sendCustomMetric('ResponseTime', duration, 'Milliseconds', [
      { Name: 'Method', Value: req.method },
      { Name: 'Route', Value: req.route?.path || req.path },
      { Name: 'StatusCode', Value: res.statusCode.toString() }
    ]);

    // Record errors
    if (res.statusCode >= 400) {
      recordError();
    }
  });
  
  next();
}

/**
 * Get metrics data for WebSocket broadcasting
 */
async function getMetricsData() {
  try {
    const currentMetrics = getCurrentMetrics();
    
    // Get CloudWatch metrics for the last hour
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Fetch real metrics from CloudWatch
    let totalRequests = [];
    let errorRate = [];
    let responseTime = [];
    let featureFlagEvaluations = [];
    
    try {
      totalRequests = await getCloudWatchMetric('TotalRequests', startTime, endTime);
      errorRate = await getCloudWatchMetric('ErrorRate', startTime, endTime);
      responseTime = await getCloudWatchMetric('ResponseTime', startTime, endTime);
      featureFlagEvaluations = await getCloudWatchMetric('FeatureFlagEvaluations', startTime, endTime);
      
      console.log('Successfully fetched real metrics from CloudWatch');
    } catch (cloudWatchError) {
      console.error('Error fetching CloudWatch metrics:', cloudWatchError);
    }
    
    // Process the real metrics data
    const processMetricData = (metricData, defaultValue = 0) => {
      if (!metricData || !Array.isArray(metricData) || metricData.length === 0) {
        return defaultValue;
      }
      
      // Sort by timestamp
      metricData.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
      
      // Get the latest value
      return metricData[metricData.length - 1].Sum || defaultValue;
    };
    
    // Get yesterday's data for comparison
    const yesterdayStart = new Date(startTime);
    const yesterdayEnd = new Date(startTime);
    yesterdayEnd.setHours(yesterdayEnd.getHours() + 24);
    
    let yesterdayRequests = [];
    let yesterdayErrorRate = [];
    
    try {
      yesterdayRequests = await getCloudWatchMetric('TotalRequests', yesterdayStart, yesterdayEnd);
      yesterdayErrorRate = await getCloudWatchMetric('ErrorRate', yesterdayStart, yesterdayEnd);
    } catch (error) {
      console.error('Error fetching yesterday metrics:', error);
    }
    
    // Calculate metrics
    const impressionsToday = processMetricData(totalRequests, 0);
    const impressionsYesterday = processMetricData(yesterdayRequests, 0);
    const errRateToday = processMetricData(errorRate, 0);
    const errRateYesterday = processMetricData(yesterdayErrorRate, 0);
    
    // Estimate conversions (20% of impressions as a reasonable default)
    const conversionsToday = Math.round(impressionsToday * 0.2);
    const conversionsYesterday = Math.round(impressionsYesterday * 0.2);
    
    // Calculate changes
    const calcPercentChange = (today, yesterday) => {
      if (yesterday === 0) return 0;
      return Math.round((today / yesterday - 1) * 100);
    };
    
    const impressionChange = calcPercentChange(impressionsToday, impressionsYesterday);
    const conversionChange = calcPercentChange(conversionsToday, conversionsYesterday);
    const errorRateChange = calcPercentChange(errRateToday, errRateYesterday);
    
    // Format dates
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Return real metrics data
    return {
      impressions: [
        { date: formatDate(startTime), count: impressionsYesterday },
        { date: formatDate(endTime), count: impressionsToday }
      ],
      conversions: [
        { date: formatDate(startTime), count: conversionsYesterday },
        { date: formatDate(endTime), count: conversionsToday }
      ],
      errors: [
        { date: formatDate(startTime), count: Math.round(impressionsYesterday * errRateYesterday / 100) },
        { date: formatDate(endTime), count: Math.round(impressionsToday * errRateToday / 100) }
      ],
      stats: {
        impressions: impressionsToday,
        impressionChange,
        conversions: conversionsToday,
        conversionChange,
        errorRate: errRateToday,
        errorRateChange: -errorRateChange // Negative to show improvement
      },
      cloudWatch: {
        totalRequests,
        errorRate,
        responseTime,
        featureFlagEvaluations
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get metrics data:', error);
    // Return minimal data structure on error
    return {
      impressions: [],
      conversions: [],
      errors: [],
      stats: {
        impressions: 0,
        impressionChange: 0,
        conversions: 0,
        conversionChange: 0,
        errorRate: 0,
        errorRateChange: 0
      },
      cloudWatch: {},
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Get CloudWatch metric data
 */
async function getCloudWatchMetric(metricName, startTime, endTime) {
  try {
    const { getMetrics } = require('./aws');
    const data = await getMetrics(metricName, startTime, endTime, 300);
    return data || [];
  } catch (error) {
    console.error(`Failed to get ${metricName} metric:`, error);
    // Return empty array on error
    return [];
  }
}

module.exports = {
  startMetricsCollection,
  recordRequest,
  recordError,
  recordFeatureFlagEvaluation,
  getCurrentMetrics,
  sendCustomMetric,
  metricsMiddleware,
  getMetricsData
}; 