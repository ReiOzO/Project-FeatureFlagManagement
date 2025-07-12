const { getFeatureFlagConfiguration, updateFeatureFlagConfiguration, sendMetric } = require('./aws');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

// In-memory cache for feature flags
let featureFlagsCache = {};
let lastUpdateTime = null;

/**
 * Initialize feature flags cache
 */
async function initializeCache() {
  try {
    await refreshFeatureFlagsCache();
    console.log('✅ Feature flags cache initialized');
  } catch (error) {
    console.error('❌ Failed to initialize feature flags cache:', error);
    // Initialize with default flags if AWS fails
    featureFlagsCache = getDefaultFeatureFlags();
    lastUpdateTime = new Date();
    console.log('✅ Feature flags cache initialized with default flags');
  }
}

/**
 * Get default feature flags (fallback)
 */
function getDefaultFeatureFlags() {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    flags: {
      'new-ui-design': {
        enabled: true,
        rolloutPercentage: 100,
        targeting: {
          userGroups: ["beta-users"],
          userIds: []
        },
        variants: [
          { name: 'modern', weight: 100 }
        ],
        metadata: {
          description: 'New UI Design Feature',
          owner: 'frontend-team',
          createdAt: new Date().toISOString()
        }
      }
    }
  };
}

/**
 * Refresh feature flags cache from AWS AppConfig
 */
async function refreshFeatureFlagsCache() {
  try {
    // Remove the check for AWS credentials since we're now hardcoding them
    
    const configuration = await getFeatureFlagConfiguration();
    
    if (configuration && configuration.flags) {
      featureFlagsCache = configuration;
      lastUpdateTime = new Date();
      
      // Send metric for cache refresh
      try {
        await sendMetric('CacheRefresh', 1, 'Count');
      } catch (metricError) {
        console.warn('Failed to send cache refresh metric:', metricError);
      }
      
      console.log('✅ Feature flags cache refreshed from AWS AppConfig');
    } else {
      console.log('⚠️ No configuration found from AWS AppConfig, using default flags');
      featureFlagsCache = getDefaultFeatureFlags();
      lastUpdateTime = new Date();
    }
  } catch (error) {
    console.error('❌ Failed to refresh feature flags cache:', error);
    // Use default flags as fallback
    console.log('⚠️ Using default feature flags as fallback due to error');
    featureFlagsCache = getDefaultFeatureFlags();
    lastUpdateTime = new Date();
  }
}

/**
 * Get all feature flags
 */
function getAllFeatureFlags() {
  return {
    ...featureFlagsCache,
    flags: featureFlagsCache.flags || {},
    cacheInfo: {
      lastUpdated: lastUpdateTime,
      totalFlags: Object.keys(featureFlagsCache.flags || {}).length
    }
  };
}

/**
 * Get specific feature flag
 */
function getFeatureFlag(flagName) {
  return featureFlagsCache.flags?.[flagName] || null;
}

/**
 * Check if feature flag is enabled for user
 */
function isFeatureEnabled(flagName, userId, userGroups = [], userAttributes = {}) {
  const flag = getFeatureFlag(flagName);
  
  if (!flag) {
    console.warn(`Feature flag '${flagName}' not found`);
    return false;
  }

  // Check if flag is globally disabled
  if (!flag.enabled) {
    return false;
  }

  // Check user targeting
  if (flag.targeting) {
    // Check specific user IDs
    if (flag.targeting.userIds && flag.targeting.userIds.includes(userId)) {
      return true;
    }

    // Check user groups
    if (flag.targeting.userGroups && flag.targeting.userGroups.length > 0) {
      const hasMatchingGroup = userGroups.some(group => 
        flag.targeting.userGroups.includes(group)
      );
      if (!hasMatchingGroup) {
        return false;
      }
    }
  }

  // Check rollout percentage
  if (flag.rolloutPercentage < 100) {
    const userHash = hashUserId(userId, flagName);
    const userPercentile = userHash % 100;
    
    if (userPercentile >= flag.rolloutPercentage) {
      return false;
    }
  }

  // Send metric for feature flag evaluation
  try {
    sendMetric('FeatureFlagEvaluation', 1, 'Count', [
      { Name: 'FeatureFlagName', Value: flagName },
      { Name: 'Result', Value: 'enabled' }
    ]);
  } catch (error) {
    console.warn('Failed to send feature flag evaluation metric:', error);
  }

  return true;
}

/**
 * Get feature flag variant for A/B testing
 */
function getFeatureVariant(flagName, userId, userGroups = [], userAttributes = {}) {
  const flag = getFeatureFlag(flagName);
  
  if (!flag || !isFeatureEnabled(flagName, userId, userGroups, userAttributes)) {
    return null;
  }

  // If no variants defined, return control
  if (!flag.variants || flag.variants.length === 0) {
    return 'control';
  }

  // Single variant
  if (flag.variants.length === 1) {
    return flag.variants[0].name;
  }

  // Multiple variants - use weighted selection
  const userHash = hashUserId(userId, flagName + '-variant');
  const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
  const userWeight = userHash % totalWeight;
  
  let cumulativeWeight = 0;
  for (const variant of flag.variants) {
    cumulativeWeight += variant.weight;
    if (userWeight < cumulativeWeight) {
      // Send metric for variant assignment
      try {
        sendMetric('VariantAssignment', 1, 'Count', [
          { Name: 'FeatureFlagName', Value: flagName },
          { Name: 'Variant', Value: variant.name }
        ]);
      } catch (error) {
        console.warn('Failed to send variant assignment metric:', error);
      }
      
      return variant.name;
    }
  }

  // Fallback to first variant
  return flag.variants[0].name;
}

/**
 * Create or update feature flag
 */
async function createOrUpdateFeatureFlag(flagName, flagData) {
  try {
    // Validate flag data
    const validatedFlag = validateFeatureFlag(flagData);
    
    // Update cache
    if (!featureFlagsCache.flags) {
      featureFlagsCache.flags = {};
    }
    
    featureFlagsCache.flags[flagName] = {
      ...validatedFlag,
      metadata: {
        ...validatedFlag.metadata,
        lastUpdated: new Date().toISOString()
      }
    };

    // Update version
    featureFlagsCache.version = generateVersion();
    featureFlagsCache.lastUpdated = new Date().toISOString();

    // Save to AWS AppConfig
    await updateFeatureFlagConfiguration(featureFlagsCache);

    // Send metric
    try {
      await sendMetric('FeatureFlagUpdate', 1, 'Count', [
        { Name: 'FeatureFlagName', Value: flagName }
      ]);
    } catch (error) {
      console.warn('Failed to send feature flag update metric:', error);
    }

    console.log(`✅ Feature flag '${flagName}' updated successfully`);
    return featureFlagsCache.flags[flagName];
  } catch (error) {
    console.error(`❌ Failed to update feature flag '${flagName}':`, error);
    throw error;
  }
}

/**
 * Delete feature flag
 */
async function deleteFeatureFlag(flagName) {
  try {
    if (!featureFlagsCache.flags || !featureFlagsCache.flags[flagName]) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }

    // Remove from cache
    delete featureFlagsCache.flags[flagName];
    
    // Update version
    featureFlagsCache.version = generateVersion();
    featureFlagsCache.lastUpdated = new Date().toISOString();

    // Save to AWS AppConfig
    await updateFeatureFlagConfiguration(featureFlagsCache);

    // Send metric
    try {
      await sendMetric('FeatureFlagDelete', 1, 'Count', [
        { Name: 'FeatureFlagName', Value: flagName }
      ]);
    } catch (error) {
      console.warn('Failed to send feature flag delete metric:', error);
    }

    console.log(`✅ Feature flag '${flagName}' deleted successfully`);
  } catch (error) {
    console.error(`❌ Failed to delete feature flag '${flagName}':`, error);
    throw error;
  }
}

/**
 * Update feature flag rollout percentage
 */
async function updateRolloutPercentage(flagName, percentage) {
  try {
    const flag = getFeatureFlag(flagName);
    if (!flag) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }

    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    // Update rollout percentage
    flag.rolloutPercentage = percentage;
    flag.metadata.lastUpdated = new Date().toISOString();

    // Save changes
    await createOrUpdateFeatureFlag(flagName, flag);

    // Send metric
    try {
      await sendMetric('RolloutPercentageUpdate', percentage, 'Percent', [
        { Name: 'FeatureFlagName', Value: flagName }
      ]);
    } catch (error) {
      console.warn('Failed to send rollout percentage update metric:', error);
    }

    console.log(`✅ Rollout percentage for '${flagName}' updated to ${percentage}%`);
    return flag;
  } catch (error) {
    console.error(`❌ Failed to update rollout percentage for '${flagName}':`, error);
    throw error;
  }
}

/**
 * Validate feature flag data
 */
function validateFeatureFlag(flagData) {
  const requiredFields = ['enabled', 'rolloutPercentage'];
  
  for (const field of requiredFields) {
    if (flagData[field] === undefined || flagData[field] === null) {
      throw new Error(`Required field '${field}' is missing`);
    }
  }

  // Validate rollout percentage
  if (flagData.rolloutPercentage < 0 || flagData.rolloutPercentage > 100) {
    throw new Error('Rollout percentage must be between 0 and 100');
  }

  // Validate variants
  if (flagData.variants && flagData.variants.length > 0) {
    for (const variant of flagData.variants) {
      if (!variant.name || typeof variant.weight !== 'number') {
        throw new Error('Invalid variant configuration');
      }
    }
  }

  return {
    enabled: Boolean(flagData.enabled),
    rolloutPercentage: Number(flagData.rolloutPercentage),
    targeting: flagData.targeting || { userGroups: [], userIds: [] },
    variants: flagData.variants || [{ name: 'control', weight: 100 }],
    metadata: {
      description: flagData.metadata?.description || '',
      owner: flagData.metadata?.owner || 'unknown',
      createdAt: flagData.metadata?.createdAt || new Date().toISOString(),
      ...flagData.metadata
    }
  };
}

/**
 * Hash user ID for consistent percentage calculation
 */
function hashUserId(userId, salt = '') {
  const str = userId + salt;
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Generate version string
 */
function generateVersion() {
  const now = new Date();
  return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${now.getHours()}${now.getMinutes()}`;
}

/**
 * Get feature flag statistics
 */
function getFeatureFlagStats() {
  const flags = featureFlagsCache.flags || {};
  const totalFlags = Object.keys(flags).length;
  const enabledFlags = Object.values(flags).filter(flag => flag.enabled).length;
  const partialRollouts = Object.values(flags).filter(flag => flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100).length;
  const abTestFlags = Object.values(flags).filter(flag => flag.variants && flag.variants.length > 1).length;

  return {
    totalFlags,
    enabledFlags,
    disabledFlags: totalFlags - enabledFlags,
    partialRollouts,
    abTestFlags,
    cacheInfo: {
      lastUpdated: lastUpdateTime,
      version: featureFlagsCache.version
    }
  };
}

module.exports = {
  initializeCache,
  refreshFeatureFlagsCache,
  getAllFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  getFeatureVariant,
  createOrUpdateFeatureFlag,
  deleteFeatureFlag,
  updateRolloutPercentage,
  getFeatureFlagStats
}; 