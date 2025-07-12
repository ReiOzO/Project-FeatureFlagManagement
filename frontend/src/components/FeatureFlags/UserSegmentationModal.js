import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, UserPlus, Search } from 'lucide-react';

const UserSegmentationModal = ({ isOpen, onClose, onSave, flag }) => {
  const [userGroups, setUserGroups] = useState([]);
  const [userIds, setUserIds] = useState([]);
  const [newUserGroup, setNewUserGroup] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [availableGroups, setAvailableGroups] = useState([
    'beta-users', 'premium-users', 'internal-users', 'developers', 'admin'
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (flag) {
      setUserGroups(flag.targeting?.userGroups || []);
      setUserIds(flag.targeting?.userIds || []);
    }
  }, [flag]);

  const handleAddUserGroup = () => {
    if (newUserGroup && !userGroups.includes(newUserGroup)) {
      setUserGroups([...userGroups, newUserGroup]);
      setNewUserGroup('');
    }
  };

  const handleRemoveUserGroup = (group) => {
    setUserGroups(userGroups.filter(g => g !== group));
  };

  const handleAddUserId = () => {
    if (newUserId && !userIds.includes(newUserId)) {
      setUserIds([...userIds, newUserId]);
      setNewUserId('');
    }
  };

  const handleRemoveUserId = (userId) => {
    setUserIds(userIds.filter(id => id !== userId));
  };

  const filteredAvailableGroups = availableGroups.filter(
    group => !userGroups.includes(group) && 
    group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedFlag = {
        ...flag,
        targeting: {
          ...flag.targeting,
          userGroups,
          userIds
        }
      };
      
      await onSave(updatedFlag);
      onClose();
    } catch (error) {
      console.error('Error saving user segmentation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">User Segmentation</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Groups */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                User Groups
              </h3>
              
              <div className="mb-4">
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newUserGroup}
                    onChange={(e) => setNewUserGroup(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                    placeholder="Enter group name"
                  />
                  <button
                    onClick={handleAddUserGroup}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-md p-2 mb-3">
                  <div className="flex items-center border-b border-gray-200 pb-2 mb-2">
                    <Search className="h-4 w-4 text-gray-500 mr-2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 text-sm border-none focus:outline-none"
                      placeholder="Search available groups..."
                    />
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto">
                    {filteredAvailableGroups.length === 0 ? (
                      <p className="text-sm text-gray-500 p-1">No matching groups</p>
                    ) : (
                      filteredAvailableGroups.map((group, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            setNewUserGroup(group);
                            setSearchTerm('');
                          }}
                        >
                          <span className="text-sm">{group}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserGroups([...userGroups, group]);
                              setSearchTerm('');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-md">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-sm">Selected Groups</h4>
                </div>
                <div className="p-3">
                  {userGroups.length === 0 ? (
                    <p className="text-sm text-gray-500">No groups selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userGroups.map((group, index) => (
                        <div 
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md"
                        >
                          <span className="text-sm">{group}</span>
                          <button 
                            onClick={() => handleRemoveUserGroup(group)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* User IDs */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                Specific Users
              </h3>
              
              <div className="mb-4">
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                    placeholder="Enter user ID"
                  />
                  <button
                    onClick={handleAddUserId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-md">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-sm">Selected Users</h4>
                </div>
                <div className="p-3">
                  {userIds.length === 0 ? (
                    <p className="text-sm text-gray-500">No users selected</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {userIds.map((userId, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-sm">{userId}</span>
                          <button 
                            onClick={() => handleRemoveUserId(userId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2 inline-block"></div>
            ) : null}
            Save Targeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSegmentationModal; 