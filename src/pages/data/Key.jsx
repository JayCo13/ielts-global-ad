import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, AlertCircle, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import API_BASE from '../../config/api';

const Key = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingActive, setEditingActive] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const testTypes = ['reading', 'listening', 'speaking', 'writing'];

  const formatType = (type) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const [newKey, setNewKey] = useState({
    key: '',
    type: 'reading',
    is_active: true
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/action/update-keys`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Fetch keys error:', errorMessage);
        throw new Error('Failed to fetch keys');
      }
      const data = await response.json();
      setKeys(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải khóa. Vui lòng thử lại sau.');
      toast.error('Không thể tải khóa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKey = async (keyId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/action/update-key/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ 
          key: editValue,
          type: editingType,
          is_active: editingActive
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Update key error:', errorMessage);
        throw new Error('Failed to update key');
      }
      
      await fetchKeys();
      setEditingKey(null);
      setEditingType(null);
      setEditValue('');
      toast.success('Cập nhật khóa thành công');
    } catch (err) {
      toast.error('Không thể cập nhật khóa');
    }
  };

  const startEditing = (key) => {
    setEditingKey(key.key_id);
    setEditingType(key.type);
    setEditValue(key.key);
    setEditingActive(key.is_active);
  };

  const handleDeleteKey = async (keyId) => {
    try {
      if (!keyId) {
        toast.error('ID khóa không hợp lệ');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/action/update-key/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể xóa khóa');
      }

      await fetchKeys();
      toast.success('Xóa khóa thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể xóa khóa';
      toast.error(errorMessage);
    }
  };

  const handleCreateKey = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/action/update-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(newKey),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Create key error:', errorMessage);
        throw new Error('Failed to create key');
      }
      
      await fetchKeys();
      setShowCreateForm(false);
      setNewKey({ key: '', type: 'READING', is_active: true });
      toast.success('Tạo khóa thành công');
    } catch (err) {
      toast.error('Không thể tạo khóa');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
          <p className="mt-4 text-base text-gray-600">Đang tải khóa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-base">Trang chủ</Link>
            <ChevronRight className="text-gray-400" size={16} />
            <span className="text-gray-900 text-base">Quản lý khóa</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa hệ thống</h1>
          <p className="mt-1 text-md font-bold text-red-500">
            * Lưu ý chỉ có 4 api keys duy nhất đại diện cho 4 loại forms
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            {showCreateForm ? 'Hủy tạo mới' : 'Tạo khóa mới'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tạo khóa mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700">API Key</label>
                <input
                  type="text"
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Loại</label>
                <select
                  value={newKey.type}
                  onChange={(e) => setNewKey({ ...newKey, type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                >
                  {testTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatType(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Trạng thái</label>
                <select
                  value={newKey.is_active.toString()}
                  onChange={(e) => setNewKey({ ...newKey, is_active: e.target.value === 'true' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="true">Kích hoạt</option>
                  <option value="false">Không kích hoạt</option>
                </select>
              </div>
              <button
                onClick={handleCreateKey}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Tạo khóa
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">API Key</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-blue-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keys.map((key) => (
                <tr key={key.key_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{key.key_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingKey === key.key_id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-gray-900">{key.key}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingKey === key.key_id ? (
                      <select
                        value={editingType}
                        onChange={(e) => setEditingType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        {testTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatType(type)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-base text-gray-500">{key.type}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingKey === key.key_id ? (
                      <select
                        value={editingActive.toString()}
                        onChange={(e) => setEditingActive(e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="true">Kích hoạt</option>
                        <option value="false">Không kích hoạt</option>
                      </select>
                    ) : (
                      <div className={`text-base ${key.is_active ? 'text-green-500' : 'text-red-500'}`}>
                        {key.is_active ? 'Kích hoạt' : 'Không kích hoạt'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingKey === key.key_id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateKey(key.key_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingKey(null);
                            setEditValue('');
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEditing(key)}
                        className="text-violet-600 hover:text-violet-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.key_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Key;
