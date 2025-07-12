const { initializeCache } = require('./featureFlags');

/**
 * Initialize feature flag cache
 */
async function initializeFeatureFlagCache() {
  try {
    await initializeCache();
    console.log('✅ Feature flag cache service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize feature flag cache service:', error);
    // Don't throw error - just log it and continue
    console.log('⚠️ Feature flag cache service failed, but continuing...');
  }
}

module.exports = {
  initializeFeatureFlagCache
}; 