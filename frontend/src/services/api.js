import axios from 'axios';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle response errors
    const { response } = error;
    
    if (response) {
      // Server responded with a status code outside the 2xx range
      const { status, data } = response;
      
      switch (status) {
        case 400:
          // Bad request
          console.error('Bad request:', data);
          break;
        case 401:
          // Unauthorized
          console.error('Unauthorized:', data);
          // Handle logout or refresh token
          break;
        case 403:
          // Forbidden
          console.error('Forbidden:', data);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data);
          break;
        case 500:
          // Server error
          console.error('Server error:', data);
          break;
        default:
          console.error(`Error ${status}:`, data);
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received:', error.request);
      toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Health check
  health: () => api.get('/health'),
  
  // Feature Flags
  getFeatureFlags: () => api.get('/feature-flags'),
  getFeatureFlag: (flagName) => api.get(`/feature-flags/${flagName}`),
  createFeatureFlag: (flagName, data) => api.post(`/feature-flags/${flagName}`, data),
  updateFeatureFlag: (flagName, data) => api.put(`/feature-flags/${flagName}`, data),
  deleteFeatureFlag: (flagName) => api.delete(`/feature-flags/${flagName}`),
  toggleFeatureFlag: (flagName) => api.patch(`/feature-flags/${flagName}/toggle`),
  
  // Feature Flag Stats
  getFeatureFlagStats: () => api.get('/feature-flags/stats'),
  getFeatureFlagHistory: (flagName) => api.get(`/feature-flags/${flagName}/history`),
  
  // Rollout Management
  updateRolloutPercentage: (flagName, percentage) => 
    api.patch(`/feature-flags/${flagName}/rollout`, { percentage }),
  
  // A/B Testing
  getABTestResults: (flagName) => api.get(`/ab-testing/${flagName}/results`),
  createABTest: (flagName, data) => api.post(`/ab-testing/${flagName}`, data),
  
  // Metrics and Monitoring
  getMetrics: () => {
    console.log('Fetching metrics from API...');
    return api.get('/metrics').then(response => {
      console.log('Metrics API response:', response.data);
      return response;
    }).catch(error => {
      console.error('Error fetching metrics:', error);
      throw error;
    });
  },
  getCloudWatchMetrics: (params) => api.get('/metrics/cloudwatch', { params }),
  getSystemHealth: () => api.get('/health/system'),
  
  // Deployment Management
  getDeployments: () => api.get('/deployments'),
  getDeployment: (deploymentId) => api.get(`/deployments/${deploymentId}`),
  rollbackDeployment: (deploymentId) => api.post(`/deployments/${deploymentId}/rollback`),
  
  // AWS AppConfig Integration
  getAppConfigApplications: () => api.get('/aws/appconfig/applications'),
  getAppConfigEnvironments: (appId) => api.get(`/aws/appconfig/applications/${appId}/environments`),
  getAppConfigProfiles: (appId) => api.get(`/aws/appconfig/applications/${appId}/profiles`),
  
  // Automated Rollback
  getRollbackRules: () => api.get('/rollback/rules'),
  createRollbackRule: (data) => api.post('/rollback/rules', data),
  updateRollbackRule: (ruleId, data) => api.put(`/rollback/rules/${ruleId}`, data),
  deleteRollbackRule: (ruleId) => api.delete(`/rollback/rules/${ruleId}`),
  
  // User Segments
  getUserSegments: () => api.get('/user-segments'),
  createUserSegment: (data) => api.post('/user-segments', data),
  updateUserSegment: (segmentId, data) => api.put(`/user-segments/${segmentId}`, data),
  deleteUserSegment: (segmentId) => api.delete(`/user-segments/${segmentId}`)
};

export default api; 