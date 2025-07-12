const socketIo = require('socket.io');
const { getFeatureFlagConfiguration } = require('./aws');
const { getMetricsData } = require('./metrics');

let io;
let connectedClients = new Set();

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    connectedClients.add(socket.id);

    // Send initial data to new client
    sendInitialData(socket);

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });

    // Handle feature flag subscription
    socket.on('subscribe:feature-flags', () => {
      socket.join('feature-flags');
      console.log(`Client ${socket.id} subscribed to feature flags`);
    });

    // Handle metrics subscription
    socket.on('subscribe:metrics', () => {
      socket.join('metrics');
      console.log(`Client ${socket.id} subscribed to metrics`);
    });

    // Handle deployments subscription
    socket.on('subscribe:deployments', () => {
      socket.join('deployments');
      console.log(`Client ${socket.id} subscribed to deployments`);
    });

    // Handle system health subscription
    socket.on('subscribe:system-health', () => {
      socket.join('system-health');
      console.log(`Client ${socket.id} subscribed to system health`);
    });

    // Handle unsubscribe
    socket.on('unsubscribe', (channel) => {
      socket.leave(channel);
      console.log(`Client ${socket.id} unsubscribed from ${channel}`);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('✅ WebSocket server initialized');
  
  // Start broadcasting updates
  startBroadcastingUpdates();
  
  return io;
}

/**
 * Send initial data to new client
 */
async function sendInitialData(socket) {
  try {
    // Send feature flags
    try {
      const featureFlags = await getFeatureFlagConfiguration();
      socket.emit('feature-flags:initial', featureFlags);
    } catch (error) {
      console.error('Error getting feature flags:', error);
      socket.emit('feature-flags:initial', null);
    }

    // Send metrics
    try {
      const metrics = await getMetricsData();
      socket.emit('metrics:initial', metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      socket.emit('metrics:initial', { error: 'Failed to load metrics' });
    }

    // Send system status
    try {
      const systemStatus = await getSystemStatus();
      socket.emit('system-health:initial', systemStatus);
    } catch (error) {
      console.error('Error getting system status:', error);
      socket.emit('system-health:initial', { error: 'Failed to load system status' });
    }
    
  } catch (error) {
    console.error('Error sending initial data:', error);
    socket.emit('error', { message: 'Failed to load initial data' });
  }
}

/**
 * Start broadcasting real-time updates
 */
function startBroadcastingUpdates() {
  // Broadcast feature flag updates every 10 seconds
  setInterval(async () => {
    try {
      const featureFlags = await getFeatureFlagConfiguration();
      broadcastToRoom('feature-flags', 'feature-flags:update', featureFlags);
    } catch (error) {
      console.error('Error broadcasting feature flags:', error);
      // Don't broadcast anything on error
    }
  }, 10000);

  // Broadcast metrics updates every 5 seconds
  setInterval(async () => {
    try {
      const metrics = await getMetricsData();
      broadcastToRoom('metrics', 'metrics:update', metrics);
    } catch (error) {
      console.error('Error broadcasting metrics:', error);
      // Don't broadcast anything on error
    }
  }, 5000);

  // Broadcast system health updates every 30 seconds
  setInterval(async () => {
    try {
      const systemHealth = await getSystemStatus();
      broadcastToRoom('system-health', 'system-health:update', systemHealth);
    } catch (error) {
      console.error('Error broadcasting system health:', error);
      // Don't broadcast anything on error
    }
  }, 30000);
}

/**
 * Broadcast message to specific room
 */
function broadcastToRoom(room, event, data) {
  if (io) {
    io.to(room).emit(event, data);
  }
}

/**
 * Broadcast to all connected clients
 */
function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Notify about feature flag changes
 */
function notifyFeatureFlagChange(flagName, action, data) {
  const notification = {
    type: 'feature-flag',
    flagName,
    action, // 'created', 'updated', 'deleted', 'toggled'
    data,
    timestamp: new Date().toISOString()
  };

  broadcastToRoom('feature-flags', 'feature-flag:changed', notification);
  broadcastToAll('notification', notification);
}

/**
 * Notify about deployment changes
 */
function notifyDeploymentChange(deploymentId, action, data) {
  const notification = {
    type: 'deployment',
    deploymentId,
    action, // 'started', 'completed', 'failed', 'stopped'
    data,
    timestamp: new Date().toISOString()
  };

  broadcastToRoom('deployments', 'deployment:changed', notification);
  broadcastToAll('notification', notification);
}

/**
 * Notify about system alerts
 */
function notifySystemAlert(alert) {
  const notification = {
    type: 'system-alert',
    severity: alert.severity, // 'info', 'warning', 'error', 'critical'
    message: alert.message,
    details: alert.details,
    timestamp: new Date().toISOString()
  };

  broadcastToRoom('system-health', 'system-alert', notification);
  broadcastToAll('notification', notification);
}

/**
 * Notify about rollback events
 */
function notifyRollback(flagName, reason, data) {
  const notification = {
    type: 'rollback',
    flagName,
    reason,
    data,
    timestamp: new Date().toISOString()
  };

  broadcastToAll('rollback:triggered', notification);
  broadcastToAll('notification', notification);
}

/**
 * Get system status
 */
async function getSystemStatus() {
  // This would typically check various system components
  return {
    overall: 'healthy',
    services: {
      api: { status: 'healthy', responseTime: '45ms', uptime: '99.9%' },
      database: { status: 'healthy', responseTime: '12ms', uptime: '99.8%' },
      aws: { status: 'healthy', responseTime: '89ms', uptime: '99.9%' },
      cache: { status: 'warning', responseTime: '156ms', uptime: '98.2%' }
    },
    metrics: {
      totalRequests: Math.floor(Math.random() * 1000) + 12000,
      errorRate: (Math.random() * 0.5).toFixed(2),
      averageLatency: Math.floor(Math.random() * 20) + 50,
      activeConnections: Math.floor(Math.random() * 50) + 200
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get connected clients count
 */
function getConnectedClientsCount() {
  return connectedClients.size;
}

/**
 * Get WebSocket stats
 */
function getWebSocketStats() {
  return {
    connectedClients: connectedClients.size,
    rooms: io ? Object.keys(io.sockets.adapter.rooms) : [],
    uptime: process.uptime()
  };
}

module.exports = {
  initializeWebSocket,
  broadcastToRoom,
  broadcastToAll,
  notifyFeatureFlagChange,
  notifyDeploymentChange,
  notifySystemAlert,
  notifyRollback,
  getConnectedClientsCount,
  getWebSocketStats
}; 