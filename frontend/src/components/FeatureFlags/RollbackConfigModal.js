import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, Trash } from 'lucide-react';

const RollbackConfigModal = ({ isOpen, onClose, onSave, onDelete, flag, existingConfig = null }) => {
  const [metricName, setMetricName] = useState('ErrorRate');
  const [threshold, setThreshold] = useState(5);
  const [evaluationPeriods, setEvaluationPeriods] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      setMetricName(existingConfig.metricName || 'ErrorRate');
      setThreshold(existingConfig.threshold || 5);
      setEvaluationPeriods(existingConfig.evaluationPeriods || 2);
      setHasConfig(true);
    } else {
      setHasConfig(false);
    }
  }, [existingConfig]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const config = {
        flagName: flag.id || flag.name,
        metricName,
        threshold: parseFloat(threshold),
        evaluationPeriods: parseInt(evaluationPeriods)
      };
      
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving rollback configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(flag.id || flag.name);
      onClose();
    } catch (error) {
      console.error('Error deleting rollback configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {hasConfig ? 'Edit Automated Rollback' : 'Configure Automated Rollback'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Automated rollback will revert this feature flag to its previous state if the selected metric exceeds the threshold for the specified evaluation periods.
              </p>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metric to Monitor
              </label>
              <select
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ErrorRate">Error Rate (%)</option>
                <option value="Latency">Latency (ms)</option>
                <option value="RequestCount">Request Count</option>
                <option value="CPUUtilization">CPU Utilization (%)</option>
                <option value="MemoryUtilization">Memory Utilization (%)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threshold
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.1"
                />
                <span className="ml-2 text-gray-600">
                  {metricName === 'ErrorRate' ? '%' : 
                   metricName === 'Latency' ? 'ms' : 
                   metricName === 'CPUUtilization' || metricName === 'MemoryUtilization' ? '%' : 
                   'count'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {metricName === 'ErrorRate' ? 'Rollback if error rate exceeds this percentage' :
                 metricName === 'Latency' ? 'Rollback if average latency exceeds this value (ms)' :
                 metricName === 'RequestCount' ? 'Rollback if request count exceeds this value' :
                 'Rollback if utilization exceeds this percentage'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evaluation Periods
              </label>
              <input
                type="number"
                value={evaluationPeriods}
                onChange={(e) => setEvaluationPeriods(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of consecutive periods the metric must exceed the threshold before triggering rollback
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between p-4 border-t">
          <div>
            {hasConfig && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                <Trash size={16} className="mr-2" />
                Remove Rollback
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RollbackConfigModal; 