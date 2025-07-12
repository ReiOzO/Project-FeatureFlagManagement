const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
  getAllFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  getFeatureVariant,
  createOrUpdateFeatureFlag,
  deleteFeatureFlag,
  updateRolloutPercentage,
  getFeatureFlagStats,
  refreshFeatureFlagsCache
} = require('../services/featureFlags');

// Validation schemas
const featureFlagSchema = Joi.object({
  enabled: Joi.boolean().required(),
  rolloutPercentage: Joi.number().min(0).max(100).required(),
  targeting: Joi.object({
    userGroups: Joi.array().items(Joi.string()).default([]),
    userIds: Joi.array().items(Joi.string()).default([])
  }).default({}),
  variants: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    weight: Joi.number().min(0).required()
  })).default([{ name: 'control', weight: 100 }]),
  metadata: Joi.object({
    description: Joi.string().default(''),
    owner: Joi.string().default('unknown'),
    createdAt: Joi.string().isoDate().optional()
  }).default({})
});

const userContextSchema = Joi.object({
  userId: Joi.string().required(),
  userGroups: Joi.array().items(Joi.string()).default([]),
  userAttributes: Joi.object().default({})
});

const rolloutUpdateSchema = Joi.object({
  percentage: Joi.number().min(0).max(100).required()
});

/**
 * GET /api/feature-flags
 * Get all feature flags (always refresh from AWS AppConfig)
 */
router.get('/', async (req, res) => {
  try {
    await refreshFeatureFlagsCache(); // Luôn lấy mới từ AWS
    const flags = getAllFeatureFlags();
    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flags',
      message: error.message
    });
  }
});

/**
 * GET /api/feature-flags/stats
 * Get feature flag statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = getFeatureFlagStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting feature flag stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flag statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/feature-flags/refresh
 * Refresh feature flags cache from AWS AppConfig
 */
router.post('/refresh', async (req, res) => {
  try {
    await refreshFeatureFlagsCache();
    res.json({
      success: true,
      message: 'Feature flags cache refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing feature flags cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh feature flags cache',
      message: error.message
    });
  }
});

/**
 * GET /api/feature-flags/:flagName
 * Get specific feature flag
 */
router.get('/:flagName', async (req, res) => {
  try {
    const { flagName } = req.params;
    const flag = getFeatureFlag(flagName);
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found',
        message: `Feature flag '${flagName}' does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        name: flagName,
        ...flag
      }
    });
  } catch (error) {
    console.error('Error getting feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flag',
      message: error.message
    });
  }
});

/**
 * POST /api/feature-flags/:flagName
 * Create or update feature flag
 */
router.post('/:flagName', async (req, res) => {
  try {
    const { flagName } = req.params;
    
    // Validate request body
    const { error, value } = featureFlagSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.details[0].message
      });
    }

    const updatedFlag = await createOrUpdateFeatureFlag(flagName, value);
    
    res.json({
      success: true,
      data: {
        name: flagName,
        ...updatedFlag
      },
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag',
      message: error.message
    });
  }
});

/**
 * DELETE /api/feature-flags/:flagName
 * Delete feature flag
 */
router.delete('/:flagName', async (req, res) => {
  try {
    const { flagName } = req.params;
    
    await deleteFeatureFlag(flagName);
    
    res.json({
      success: true,
      message: `Feature flag '${flagName}' deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature flag',
      message: error.message
    });
  }
});

/**
 * PUT /api/feature-flags/:flagName/rollout
 * Update rollout percentage
 */
router.put('/:flagName/rollout', async (req, res) => {
  try {
    const { flagName } = req.params;
    
    // Validate request body
    const { error, value } = rolloutUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.details[0].message
      });
    }

    const updatedFlag = await updateRolloutPercentage(flagName, value.percentage);
    
    res.json({
      success: true,
      data: {
        name: flagName,
        ...updatedFlag
      },
      message: `Rollout percentage updated to ${value.percentage}%`
    });
  } catch (error) {
    console.error('Error updating rollout percentage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update rollout percentage',
      message: error.message
    });
  }
});

/**
 * POST /api/feature-flags/:flagName/evaluate
 * Evaluate feature flag for user
 */
router.post('/:flagName/evaluate', async (req, res) => {
  try {
    const { flagName } = req.params;
    
    // Validate request body
    const { error, value } = userContextSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.details[0].message
      });
    }

    const { userId, userGroups, userAttributes } = value;
    
    const isEnabled = isFeatureEnabled(flagName, userId, userGroups, userAttributes);
    const variant = getFeatureVariant(flagName, userId, userGroups, userAttributes);
    
    res.json({
      success: true,
      data: {
        flagName,
        userId,
        enabled: isEnabled,
        variant: variant,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error evaluating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate feature flag',
      message: error.message
    });
  }
});

/**
 * POST /api/feature-flags/batch-evaluate
 * Evaluate multiple feature flags for user
 */
router.post('/batch-evaluate', async (req, res) => {
  try {
    const { flagNames, userId, userGroups = [], userAttributes = {} } = req.body;
    
    // Validate required fields
    if (!flagNames || !Array.isArray(flagNames) || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: 'flagNames (array) and userId are required'
      });
    }

    const results = {};
    
    for (const flagName of flagNames) {
      try {
        const isEnabled = isFeatureEnabled(flagName, userId, userGroups, userAttributes);
        const variant = getFeatureVariant(flagName, userId, userGroups, userAttributes);
        
        results[flagName] = {
          enabled: isEnabled,
          variant: variant
        };
      } catch (error) {
        results[flagName] = {
          enabled: false,
          variant: null,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        userId,
        results,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error batch evaluating feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate feature flags',
      message: error.message
    });
  }
});

/**
 * GET /api/feature-flags/:flagName/metrics
 * Get feature flag metrics
 */
router.get('/:flagName/metrics', async (req, res) => {
  try {
    const { flagName } = req.params;
    const { startTime, endTime, period = 300 } = req.query;
    
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        message: 'startTime and endTime are required'
      });
    }

    const { getMetrics } = require('../services/aws');
    
    const metrics = await getMetrics(
      'FeatureFlagEvaluation',
      new Date(startTime),
      new Date(endTime),
      parseInt(period)
    );
    
    res.json({
      success: true,
      data: {
        flagName,
        metrics,
        period: parseInt(period),
        startTime,
        endTime
      }
    });
  } catch (error) {
    console.error('Error getting feature flag metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flag metrics',
      message: error.message
    });
  }
});

module.exports = router; 