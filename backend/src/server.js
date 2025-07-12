const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
const dotenv = require('dotenv');
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug environment variables
console.log('Environment variables loaded:', result.parsed ? 'success' : 'failed');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '****' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '****' : 'not set');
console.log('AWS_REGION:', process.env.AWS_REGION || 'not set');
console.log('APPCONFIG_APPLICATION:', process.env.APPCONFIG_APPLICATION || 'not set');
console.log('APPCONFIG_ENVIRONMENT:', process.env.APPCONFIG_ENVIRONMENT || 'not set');
console.log('APPCONFIG_PROFILE:', process.env.APPCONFIG_PROFILE || 'not set');

const featureFlagRoutes = require('./routes/featureFlags');
const metricsRoutes = require('./routes/metrics');
const healthRoutes = require('./routes/health');
const awsRoutes = require('./routes/aws');
const { initializeAWS } = require('./services/aws');
const { startMetricsCollection } = require('./services/metrics');
const { initializeFeatureFlagCache } = require('./services/cache');
const { initializeWebSocket } = require('./services/websocket');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/aws', awsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('Initializing AWS services...');
    await initializeAWS();
    
    console.log('Initializing feature flag cache...');
    await initializeFeatureFlagCache();
    
    console.log('Starting metrics collection...');
    startMetricsCollection();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Don't exit process - continue with degraded functionality
    console.log('⚠️ Continuing with degraded functionality...');
  }
}

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Feature Flag Management Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Feature flags: http://localhost:${PORT}/api/feature-flags`);
  
  await initializeServices();
});

// Initialize WebSocket
initializeWebSocket(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app; 