import React, { useState } from 'react';
import { 
  Flag, 
  ToggleLeft, 
  ToggleRight, 
  TrendingUp, 
  Users, 
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

const FeatureFlagCard = ({ flag, onUpdate, onEdit, onDelete }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRolloutControls, setShowRolloutControls] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(flag?.rolloutPercentage || 0);
  const [isUpdatingRollout, setIsUpdatingRollout] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdate({
        ...flag,
        enabled: !flag.enabled
      });
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRolloutChange = async (percentage) => {
    setRolloutPercentage(percentage);
  };

  const applyRolloutChange = async () => {
    setIsUpdatingRollout(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdate({
        ...flag,
        rolloutPercentage
      });
    } catch (error) {
      console.error('Error updating rollout percentage:', error);
    } finally {
      setIsUpdatingRollout(false);
    }
  };

  const getStatusBadge = () => {
    if (!flag.enabled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Tắt</span>;
    }
    
    if (flag.rolloutPercentage === 100) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoạt động</span>;
    }
    
    if (flag.rolloutPercentage > 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Rollout {flag.rolloutPercentage}%</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Chờ</span>;
  };

  const getVariantInfo = () => {
    if (!flag.variants || flag.variants.length <= 1) return null;
    
    return (
      <div className="flex items-center text-sm text-gray-600">
        <BarChart3 className="h-4 w-4 mr-1" />
        {flag.variants.length} variants
      </div>
    );
  };

  const getTargetingInfo = () => {
    const userGroups = flag.targeting?.userGroups || [];
    const userIds = flag.targeting?.userIds || [];
    
    if (userGroups.length === 0 && userIds.length === 0) return null;
    
    return (
      <div className="flex items-center text-sm text-gray-600">
        <Users className="h-4 w-4 mr-1" />
        {userGroups.length > 0 && `${userGroups.length} groups`}
        {userGroups.length > 0 && userIds.length > 0 && ', '}
        {userIds.length > 0 && `${userIds.length} users`}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Flag className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{flag.id || flag.name}</h3>
              <p className="text-sm text-gray-600">
                {flag.metadata?.description || 'Không có mô tả'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-3">
            {getStatusBadge()}
            {getVariantInfo()}
            {getTargetingInfo()}
          </div>
          
          {flag.enabled && flag.rolloutPercentage > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Rollout Progress</span>
                <span className="text-sm font-medium">{flag.rolloutPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${flag.rolloutPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Tạo bởi: {flag.metadata?.owner || 'frontend-team'}</span>
              <span>•</span>
              <span>
                {flag.metadata?.createdAt 
                  ? new Date(flag.metadata.createdAt).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Toggle Button */}
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`p-2 rounded-lg transition-colors ${
                  flag.enabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={flag.enabled ? 'Tắt feature flag' : 'Bật feature flag'}
              >
                {isToggling ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : flag.enabled ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </button>
              
              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          onEdit && onEdit(flag);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </button>
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          setShowRolloutControls(!showRolloutControls);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Quản lý rollout
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Xem metrics
                      </button>
                      <hr className="my-1" />
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          onDelete && onDelete(flag);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Rollout Controls */}
      {flag.enabled && showRolloutControls && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <h4 className="font-medium text-gray-800">Gradual Rollout</h4>
              <button 
                onClick={() => setShowRolloutControls(false)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">Current: {flag.rolloutPercentage}%</span>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Rollout Percentage: {rolloutPercentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rolloutPercentage}
              onChange={(e) => handleRolloutChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {[0, 25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handleRolloutChange(percentage)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  rolloutPercentage === percentage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={applyRolloutChange}
              disabled={isUpdatingRollout || rolloutPercentage === flag.rolloutPercentage}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isUpdatingRollout ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Apply Changes
            </button>
          </div>
        </div>
      )}
      
      {/* Quick Rollout Controls */}
      {flag.enabled && !showRolloutControls && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Quick Rollout</span>
              <button 
                onClick={() => setShowRolloutControls(true)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title="Show advanced rollout controls"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">Current: {flag.rolloutPercentage}%</span>
          </div>
          <div className="flex space-x-2">
            {[0, 25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => {
                  handleRolloutChange(percentage);
                  setTimeout(() => applyRolloutChange(), 100);
                }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  flag.rolloutPercentage === percentage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* A/B Testing Info */}
      {flag.enabled && flag.variants && flag.variants.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">A/B Testing Variants</h4>
          <div className="space-y-2">
            {flag.variants.map((variant, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 
                    index === 2 ? 'bg-yellow-500' : 
                    'bg-purple-500'
                  } mr-2`}></div>
                  <span className="text-sm font-medium">{variant.name}</span>
                </div>
                <span className="text-sm text-gray-600">{variant.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Warning for potential issues */}
      {flag.metadata?.lastRollback && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Đã có rollback gần đây: {flag.metadata.rollbackReason}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagCard; 