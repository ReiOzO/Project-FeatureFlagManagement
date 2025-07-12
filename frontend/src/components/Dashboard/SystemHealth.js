import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity,
  Server,
  Database,
  Cloud,
  Wifi
} from 'lucide-react';

const SystemHealth = ({ data }) => {
  if (!data) {
    return <div className="text-center py-8 text-gray-500">Đang tải...</div>;
  }
  const healthData = data;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-danger-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'warning':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'error':
        return 'text-danger-600 bg-danger-50 border-danger-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'aws':
        return <Cloud className="h-4 w-4" />;
      case 'cache':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getServiceName = (service) => {
    const names = {
      api: 'API Server',
      database: 'Database',
      aws: 'AWS Services',
      cache: 'Redis Cache'
    };
    return names[service] || service;
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(healthData.overall)}`}>
            {getStatusIcon(healthData.overall)}
            <span className="ml-2 capitalize">{healthData.overall}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* AWS Service Status */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {Object.entries(healthData.services).map(([service, info]) => (
            <div key={service} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    {getServiceIcon(service)}
                  </div>
                  <span className="font-medium text-gray-900">
                    {getServiceName(service)}
                  </span>
                </div>
                {getStatusIcon(info.status)}
              </div>
              
              {/* AWS Configuration Details */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Region</span>
                  <div className="font-medium">{info.region}</div>
                </div>
                <div>
                  <span className="text-gray-600">Application</span>
                  <div className="font-medium">{info.application}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Environment</span>
                  <div className="font-medium">{info.environment}</div>
                </div>
                <div>
                  <span className="text-gray-600">Profile</span>
                  <div className="font-medium">{info.profile}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AWS Connection Status */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">AWS Connection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-success-600">
                <CheckCircle className="inline h-5 w-5 mr-2" />
                Connected
              </div>
              <div className="text-sm text-gray-600">AWS AppConfig</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-success-600">
                <CheckCircle className="inline h-5 w-5 mr-2" />
                Active
              </div>
              <div className="text-sm text-gray-600">Feature Flag Service</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 