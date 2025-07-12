import React, { useState } from 'react';
import {
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  AlertCircle,
  Activity,
  BarChart2
} from 'lucide-react';

const MetricsChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [showDetails, setShowDetails] = useState(false);
  
  // Sample data for demonstration
  const sampleData = {
    impressions: [
      { date: '2025-07-11', count: 1245 },
      { date: '2025-07-12', count: 1532 }
    ],
    conversions: [
      { date: '2025-07-11', count: 245 },
      { date: '2025-07-12', count: 312 }
    ],
    errors: [
      { date: '2025-07-11', count: 12 },
      { date: '2025-07-12', count: 8 }
    ],
    flagMetrics: {
      'new-ui-design': {
        impressions: 1532,
        conversions: 312,
        errors: 8,
        conversionRate: 20.4,
        errorRate: 0.52
      }
    },
    variantMetrics: {
      'control': {
        impressions: 766,
        conversions: 145,
        conversionRate: 18.9
      },
      'modern': {
        impressions: 766,
        conversions: 167,
        conversionRate: 21.8
      }
    }
  };
  
  const metrics = data || sampleData;
  
  const renderBarChart = () => {
    if (!metrics.impressions || !Array.isArray(metrics.impressions) || metrics.impressions.length === 0) {
      return <div className="text-center py-4">No impression data available</div>;
    }
    
    const maxValue = Math.max(...metrics.impressions.map(d => d.count));
    
    return (
      <div className="h-40 flex items-end space-x-2">
        {metrics.impressions.map((item, index) => {
          const height = (item.count / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center mb-1">
                <div 
                  className="bg-blue-500 rounded-t-sm w-4/5" 
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render CloudWatch metrics if available
  const renderCloudWatchMetrics = () => {
    if (!metrics.cloudWatch) return null;
    
    const { totalRequests, errorRate, responseTime, featureFlagEvaluations } = metrics.cloudWatch;
    
    // Helper function to render a single metric chart
    const renderMetricChart = (metricData, title, barColor) => {
      if (!metricData || !Array.isArray(metricData) || metricData.length === 0) {
        return (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
            <div className="text-center py-4 text-gray-500">No data available</div>
      </div>
    );
  }

      // Sort data points by timestamp
      const sortedData = [...metricData].sort((a, b) => 
        new Date(a.Timestamp) - new Date(b.Timestamp)
      );
      
      // Get max value for scaling
      const maxValue = Math.max(...sortedData.map(d => d.Sum || d.Average || 0));
      
      return (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
          <div className="h-32 flex items-end space-x-1">
            {sortedData.map((item, index) => {
              const value = item.Sum || item.Average || 0;
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-1">
                    <div 
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: barColor,
                        width: '80%',
                        borderTopLeftRadius: '0.125rem',
                        borderTopRightRadius: '0.125rem'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-right text-gray-500">
            Last value: {(sortedData[sortedData.length - 1]?.Sum || sortedData[sortedData.length - 1]?.Average || 0).toFixed(2)}
          </div>
        </div>
      );
    };
    
    return (
      <div className="mt-6">
        <div className="flex items-center mb-3">
          <Activity className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">CloudWatch Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderMetricChart(totalRequests, 'Total Requests', '#3b82f6')} {/* blue-500 */}
          {renderMetricChart(errorRate, 'Error Rate (%)', '#ef4444')} {/* red-500 */}
          {renderMetricChart(responseTime, 'Response Time (ms)', '#22c55e')} {/* green-500 */}
          {renderMetricChart(featureFlagEvaluations, 'Feature Flag Evaluations', '#a855f7')} {/* purple-500 */}
        </div>
      </div>
    );
  };
  
  const renderVariantComparison = () => {
    if (!metrics.variantMetrics) return null;
    
    const variants = Object.keys(metrics.variantMetrics);
    if (variants.length <= 1) return null;
    
    const maxConversionRate = Math.max(...variants.map(v => metrics.variantMetrics[v].conversionRate));
    const bestVariant = variants.find(v => metrics.variantMetrics[v].conversionRate === maxConversionRate);
    
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">A/B Testing Results</h3>
        
        <div className="space-y-4">
          {variants.map(variant => {
            const data = metrics.variantMetrics[variant];
            const isWinner = variant === bestVariant;
            const percentage = (data.conversionRate / maxConversionRate) * 100;
            
            return (
              <div key={variant} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      variant === 'control' ? 'bg-blue-500' : 
                      variant === 'modern' ? 'bg-green-500' : 'bg-purple-500'
                    } mr-2`}></div>
                    <span className="text-sm font-medium">
                      {variant} {isWinner && <span className="text-green-600 ml-1">(Best)</span>}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{data.conversionRate.toFixed(1)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      isWinner ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Impressions: {data.impressions.toLocaleString()}</span>
                  <span>Conversions: {data.conversions.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {variants.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>{bestVariant}</strong> is performing {((metrics.variantMetrics[bestVariant].conversionRate / metrics.variantMetrics['control'].conversionRate - 1) * 100).toFixed(1)}% better than the control variant.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to safely calculate sum using reduce
  const safeReduce = (array, defaultValue = 0) => {
    if (!array || !Array.isArray(array) || array.length === 0) {
      return defaultValue;
    }
    return array.reduce((sum, item) => sum + item.count, 0);
  };

  // Helper function to safely calculate percentage change
  const safePercentageChange = (array, index1, index2) => {
    if (!array || !Array.isArray(array) || array.length <= Math.max(index1, index2)) {
      return 0;
    }
    return Math.round((array[index1].count / array[index2].count - 1) * 100);
  };
  
  return (
    <div>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Flag Metrics</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                )}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
      </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Impressions</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {safeReduce(metrics.impressions).toLocaleString()}
            </div>
            {metrics.impressions && metrics.impressions.length >= 2 && (
              <div className="text-sm text-green-600 mt-1">
                +{safePercentageChange(metrics.impressions, 1, 0)}% from yesterday
              </div>
            )}
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Conversions</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {safeReduce(metrics.conversions).toLocaleString()}
            </div>
            {metrics.conversions && metrics.conversions.length >= 2 && (
              <div className="text-sm text-green-600 mt-1">
                +{safePercentageChange(metrics.conversions, 1, 0)}% from yesterday
              </div>
            )}
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Error Rate</span>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(safeReduce(metrics.errors) / safeReduce(metrics.impressions) * 100 || 0).toFixed(2)}%
            </div>
            {metrics.errors && metrics.impressions && 
             metrics.errors.length >= 2 && metrics.impressions.length >= 2 && (
              <div className="text-sm text-green-600 mt-1">
                -{Math.round((1 - metrics.errors[1].count / metrics.impressions[1].count) / 
                  (metrics.errors[0].count / metrics.impressions[0].count) * 100)}% from yesterday
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Impressions Trend</h3>
          {renderBarChart()}
        </div>
        
        {/* CloudWatch Metrics Section */}
        {renderCloudWatchMetrics()}
        
        {showDetails && (
          <>
            {renderVariantComparison()}
            
            <div className="mt-4 flex justify-center">
              <a 
                href="#" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                View full analytics dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetricsChart; 