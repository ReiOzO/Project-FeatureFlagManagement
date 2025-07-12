import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Activity, 
  Database, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Play,
  Square,
  BarChart3
} from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const AWSConsolePanel = () => {
  const [applications, setApplications] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [lambdaFunctions, setLambdaFunctions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAWSData();
  }, []);

  const loadAWSData = async () => {
    setLoading(true);
    try {
      const [appsResponse, alarmsResponse, functionsResponse] = await Promise.all([
        apiService.getAppConfigApplications(),
        apiService.getCloudWatchAlarms(),
        apiService.getLambdaFunctions()
      ]);

      setApplications(appsResponse.data.applications || []);
      setAlarms(alarmsResponse.data.alarms || []);
      setLambdaFunctions(functionsResponse.data.functions || []);

      // Load environments for first application
      if (appsResponse.data.applications && appsResponse.data.applications.length > 0) {
        const firstApp = appsResponse.data.applications[0];
        setSelectedApp(firstApp);
        await loadEnvironments(firstApp.id);
      }
    } catch (error) {
      console.error('Error loading AWS data:', error);
      toast.error('Không thể tải dữ liệu AWS');
    } finally {
      setLoading(false);
    }
  };

  const loadEnvironments = async (appId) => {
    try {
      const response = await apiService.getAppConfigEnvironments(appId);
      setEnvironments(response.data.environments || []);
      
      // Load deployments for first environment
      if (response.data.environments && response.data.environments.length > 0) {
        const firstEnv = response.data.environments[0];
        setSelectedEnv(firstEnv);
        await loadDeployments(appId, firstEnv.id);
      }
    } catch (error) {
      console.error('Error loading environments:', error);
    }
  };

  const loadDeployments = async (appId, envId) => {
    try {
      const response = await apiService.getAppConfigDeployments(appId, envId);
      setDeployments(response.data.deployments || []);
    } catch (error) {
      console.error('Error loading deployments:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await apiService.getCloudWatchMetrics({
        namespace: 'AWS/AppConfig',
        metricName: 'ConfigurationRequests'
      });
      setMetrics(response.data.metrics || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleAppChange = async (app) => {
    setSelectedApp(app);
    setSelectedEnv(null);
    setDeployments([]);
    await loadEnvironments(app.id);
  };

  const handleEnvChange = async (env) => {
    setSelectedEnv(env);
    if (selectedApp) {
      await loadDeployments(selectedApp.id, env.id);
    }
  };

  const startDeployment = async (profileId, version) => {
    if (!selectedApp || !selectedEnv) return;

    try {
      await apiService.createAppConfigDeployment(selectedApp.id, selectedEnv.id, {
        configurationProfileId: profileId,
        configurationVersion: version,
        description: 'Deployment from dashboard'
      });
      toast.success('Deployment started successfully');
      await loadDeployments(selectedApp.id, selectedEnv.id);
    } catch (error) {
      console.error('Error starting deployment:', error);
      toast.error('Failed to start deployment');
    }
  };

  const stopDeployment = async (deploymentNumber) => {
    if (!selectedApp || !selectedEnv) return;

    try {
      await apiService.stopAppConfigDeployment(selectedApp.id, selectedEnv.id, deploymentNumber);
      toast.success('Deployment stopped successfully');
      await loadDeployments(selectedApp.id, selectedEnv.id);
    } catch (error) {
      console.error('Error stopping deployment:', error);
      toast.error('Failed to stop deployment');
    }
  };

  const invokeLambdaFunction = async (functionName) => {
    try {
      const response = await apiService.invokeLambdaFunction(functionName, {
        test: true,
        timestamp: new Date().toISOString()
      });
      toast.success(`Lambda function ${functionName} invoked successfully`);
      console.log('Lambda response:', response.data);
    } catch (error) {
      console.error('Error invoking Lambda function:', error);
      toast.error(`Failed to invoke Lambda function ${functionName}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'healthy':
      case 'complete':
      case 'successful':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'alarm':
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-danger-600" />;
      case 'insufficient_data':
      case 'warning':
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'healthy':
      case 'complete':
      case 'successful':
        return 'text-success-600 bg-success-50';
      case 'alarm':
      case 'error':
      case 'failed':
        return 'text-danger-600 bg-danger-50';
      case 'insufficient_data':
      case 'warning':
      case 'in_progress':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span>Loading AWS Console data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">AWS Console</h2>
          </div>
          <button
            onClick={loadAWSData}
            className="btn btn-secondary px-4 py-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'appconfig', label: 'AppConfig', icon: Settings },
            { id: 'cloudwatch', label: 'CloudWatch', icon: Activity },
            { id: 'lambda', label: 'Lambda', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-primary-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-primary-900">
                      {applications.length}
                    </div>
                    <div className="text-sm text-primary-700">AppConfig Apps</div>
                  </div>
                </div>
              </div>

              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-success-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-success-900">
                      {alarms.filter(a => a.state === 'OK').length}
                    </div>
                    <div className="text-sm text-success-700">Healthy Alarms</div>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-warning-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-warning-900">
                      {lambdaFunctions.length}
                    </div>
                    <div className="text-sm text-warning-700">Lambda Functions</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Deployments */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Deployments</h3>
                <div className="space-y-3">
                  {deployments.slice(0, 5).map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {getStatusIcon(deployment.state)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            Deployment #{deployment.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {deployment.description || 'No description'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {deployment.percentageComplete}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alarm Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">CloudWatch Alarms</h3>
                <div className="space-y-3">
                  {alarms.slice(0, 5).map((alarm) => (
                    <div key={alarm.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {getStatusIcon(alarm.state)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {alarm.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {alarm.description || 'No description'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(alarm.state)}`}>
                        {alarm.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AppConfig Tab */}
        {activeTab === 'appconfig' && (
          <div className="space-y-6">
            {/* Application Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Application
              </label>
              <select
                value={selectedApp?.id || ''}
                onChange={(e) => {
                  const app = applications.find(a => a.id === e.target.value);
                  if (app) handleAppChange(app);
                }}
                className="input w-full max-w-md"
              >
                <option value="">Select an application...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedApp && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Environments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Environments</h3>
                  <div className="space-y-3">
                    {environments.map(env => (
                      <div 
                        key={env.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEnv?.id === env.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleEnvChange(env)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{env.name}</div>
                            <div className="text-sm text-gray-500">{env.description}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(env.state)}`}>
                            {env.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deployments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Deployments</h3>
                  <div className="space-y-3">
                    {deployments.map(deployment => (
                      <div key={deployment.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getStatusIcon(deployment.state)}
                            <span className="ml-2 font-medium text-gray-900">
                              #{deployment.id}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {deployment.state === 'DEPLOYING' && (
                              <button
                                onClick={() => stopDeployment(deployment.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Stop deployment"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                            )}
                            <a
                              href={`https://console.aws.amazon.com/systems-manager/appconfig/applications/${selectedApp.id}/environments/${selectedEnv?.id}/deployments/${deployment.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                              title="View in AWS Console"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {deployment.description}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Progress: {deployment.percentageComplete}%
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(deployment.state)}`}>
                            {deployment.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CloudWatch Tab */}
        {activeTab === 'cloudwatch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">CloudWatch Alarms</h3>
              <button
                onClick={loadMetrics}
                className="btn btn-secondary px-4 py-2"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Load Metrics
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {alarms.map(alarm => (
                <div key={alarm.name} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(alarm.state)}
                      <span className="ml-2 font-medium text-gray-900">
                        {alarm.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(alarm.state)}`}>
                        {alarm.state}
                      </span>
                      <a
                        href={`https://console.aws.amazon.com/cloudwatch/home?region=${process.env.REACT_APP_AWS_REGION || 'us-east-1'}#alarmsV2:alarm/${encodeURIComponent(alarm.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                        title="View in CloudWatch Console"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {alarm.description || 'No description'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Metric: {alarm.metricName} | Threshold: {alarm.threshold}
                  </div>
                  {alarm.stateReason && (
                    <div className="text-xs text-gray-500 mt-1">
                      Reason: {alarm.stateReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lambda Tab */}
        {activeTab === 'lambda' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Lambda Functions</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {lambdaFunctions.map(func => (
                <div key={func.name} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-primary-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        {func.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => invokeLambdaFunction(func.name)}
                        className="btn btn-primary px-3 py-1 text-sm"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Invoke
                      </button>
                      <a
                        href={`https://console.aws.amazon.com/lambda/home?region=${process.env.REACT_APP_AWS_REGION || 'us-east-1'}#/functions/${func.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                        title="View in Lambda Console"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {func.description || 'No description'}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Runtime:</span> {func.runtime}
                    </div>
                    <div>
                      <span className="font-medium">Memory:</span> {func.memorySize}MB
                    </div>
                    <div>
                      <span className="font-medium">Timeout:</span> {func.timeout}s
                    </div>
                    <div>
                      <span className="font-medium">State:</span> {func.state}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AWSConsolePanel; 