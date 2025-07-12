import React, { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';

const FeatureFlagModal = ({ isOpen, onClose, onSave, flag = null }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [userGroups, setUserGroups] = useState([]);
  const [userGroupInput, setUserGroupInput] = useState('');
  const [variants, setVariants] = useState([
    { name: 'control', weight: 50 },
    { name: 'variant-a', weight: 50 }
  ]);
  const [isABTestingEnabled, setIsABTestingEnabled] = useState(false);

  useEffect(() => {
    if (flag) {
      setName(flag.id || '');
      setDescription(flag.metadata?.description || '');
      setEnabled(flag.enabled || false);
      setRolloutPercentage(flag.rolloutPercentage || 0);
      setUserGroups(flag.targeting?.userGroups || []);
      
      // Set variants if they exist
      if (flag.variants && flag.variants.length > 0) {
        setVariants(flag.variants);
        setIsABTestingEnabled(true);
      } else {
        setVariants([
          { name: 'control', weight: 100 }
        ]);
        setIsABTestingEnabled(false);
      }
    } else {
      resetForm();
    }
  }, [flag]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEnabled(false);
    setRolloutPercentage(0);
    setUserGroups([]);
    setUserGroupInput('');
    setVariants([
      { name: 'control', weight: 50 },
      { name: 'variant-a', weight: 50 }
    ]);
    setIsABTestingEnabled(false);
  };

  const handleAddUserGroup = () => {
    if (userGroupInput.trim() && !userGroups.includes(userGroupInput.trim())) {
      setUserGroups([...userGroups, userGroupInput.trim()]);
      setUserGroupInput('');
    }
  };

  const handleRemoveUserGroup = (group) => {
    setUserGroups(userGroups.filter(g => g !== group));
  };

  const handleAddVariant = () => {
    const newVariantName = `variant-${String.fromCharCode(97 + variants.length - 1)}`;
    const newVariants = [...variants];
    
    // Redistribute weights
    const newWeight = Math.floor(100 / (variants.length + 1));
    newVariants.forEach(v => v.weight = newWeight);
    
    newVariants.push({ name: newVariantName, weight: newWeight });
    
    // Adjust to ensure total is 100%
    const totalWeight = newVariants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight < 100) {
      newVariants[0].weight += (100 - totalWeight);
    }
    
    setVariants(newVariants);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 1) return;
    
    const newVariants = variants.filter((_, i) => i !== index);
    
    // Redistribute weights
    const newWeight = Math.floor(100 / newVariants.length);
    newVariants.forEach(v => v.weight = newWeight);
    
    // Adjust to ensure total is 100%
    const totalWeight = newVariants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight < 100) {
      newVariants[0].weight += (100 - totalWeight);
    }
    
    setVariants(newVariants);
  };

  const handleVariantNameChange = (index, value) => {
    const newVariants = [...variants];
    newVariants[index].name = value;
    setVariants(newVariants);
  };

  const handleVariantWeightChange = (index, value) => {
    const newWeight = parseInt(value) || 0;
    if (newWeight < 0) return;
    
    const newVariants = [...variants];
    
    // Calculate the difference from the previous weight
    const diff = newWeight - newVariants[index].weight;
    
    // Don't allow weights to go below 0 for any variant
    if (diff > 0) {
      // If increasing this weight, decrease others proportionally
      const otherVariants = newVariants.filter((_, i) => i !== index);
      const totalOtherWeight = otherVariants.reduce((sum, v) => sum + v.weight, 0);
      
      if (totalOtherWeight <= diff) return; // Can't decrease others enough
      
      for (let i = 0; i < newVariants.length; i++) {
        if (i !== index) {
          const proportion = newVariants[i].weight / totalOtherWeight;
          newVariants[i].weight = Math.max(0, Math.floor(newVariants[i].weight - (diff * proportion)));
        }
      }
    }
    
    newVariants[index].weight = newWeight;
    
    // Ensure total is 100%
    const totalWeight = newVariants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      // Find the variant with the largest weight to adjust
      const largestIndex = newVariants.reduce(
        (maxIdx, v, i) => i !== index && v.weight > newVariants[maxIdx].weight ? i : maxIdx, 
        index === 0 ? 1 : 0
      );
      newVariants[largestIndex].weight += (100 - totalWeight);
    }
    
    setVariants(newVariants);
  };

  const handleSave = () => {
    const flagData = {
      id: name,
      enabled,
      rolloutPercentage,
      targeting: {
        userGroups,
        userIds: []
      },
      variants: isABTestingEnabled ? variants : [{ name: 'control', weight: 100 }],
      metadata: {
        description,
        owner: 'frontend-team',
        createdAt: new Date().toISOString()
      }
    };
    
    onSave(flagData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {flag ? 'Chỉnh sửa Feature Flag' : 'Tạo Feature Flag mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4">
            {/* Basic Information */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên Flag
                  </label>
                  <input
                    type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="new-feature"
                disabled={flag !== null}
              />
                </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
                  </label>
                  <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Mô tả về feature flag này"
                    />
                  </div>

            {/* Status */}
            <div className="flex items-center">
                    <input
                      type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-700">
                Kích hoạt
                  </label>
                </div>

            {/* Rollout Percentage */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tỷ lệ triển khai: {rolloutPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                value={rolloutPercentage}
                onChange={(e) => setRolloutPercentage(parseInt(e.target.value))}
                    className="w-full"
                  />
              <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* User Groups */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhóm người dùng
                  </label>
              <div className="flex">
                    <input
                      type="text"
                  value={userGroupInput}
                  onChange={(e) => setUserGroupInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  placeholder="beta-users"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUserGroup()}
                    />
                    <button
                  onClick={handleAddUserGroup}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {userGroups.map((group, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md"
                  >
                    <span>{group}</span>
                    <button 
                      onClick={() => handleRemoveUserGroup(group)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {userGroups.length === 0 && (
                  <span className="text-sm text-gray-500">Không có nhóm người dùng nào</span>
                )}
                  </div>
                </div>

            {/* A/B Testing */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center mb-3">
                    <input
                  type="checkbox"
                  id="abTesting"
                  checked={isABTestingEnabled}
                  onChange={(e) => {
                    setIsABTestingEnabled(e.target.checked);
                    if (e.target.checked && variants.length === 1) {
                      setVariants([
                        { name: 'control', weight: 50 },
                        { name: 'variant-a', weight: 50 }
                      ]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="abTesting" className="ml-2 text-sm font-medium text-gray-700">
                  Bật A/B Testing
                </label>
              </div>
              
              {isABTestingEnabled && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Các biến thể (Variants)</h3>
                    <button
                      onClick={handleAddVariant}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      disabled={variants.length >= 5}
                    >
                      <Plus size={16} className="mr-1" />
                      Thêm biến thể
                    </button>
                </div>

                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => handleVariantNameChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Tên biến thể"
                        />
                        <div className="flex items-center w-32">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={variant.weight}
                            onChange={(e) => handleVariantWeightChange(index, e.target.value)}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-md"
                          />
                          <span className="ml-2">%</span>
                        </div>
                          <button
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={variants.length <= 1}
                        >
                          <Trash size={16} />
                          </button>
                      </div>
                    ))}
                </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Tổng tỷ lệ: {variants.reduce((sum, v) => sum + v.weight, 0)}% (phải bằng 100%)
                  </div>
                </div>
              )}
                </div>
              </div>
        </div>

        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!name.trim()}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagModal; 