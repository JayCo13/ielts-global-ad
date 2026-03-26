import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, AlertCircle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import API_BASE from '../../config/api';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editType, setEditType] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const notificationTypes = ['update', 'announcement', 'maintenance'];

  const [newNotification, setNewNotification] = useState({
    content: '',
    type: 'update',
    is_active: true,
    image_url: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/action/user-notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) throw new Error('Không thể lấy thông báo');
      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (notification) => {
    console.log('Notification data:', notification);
    const notificationType = String(notification.type).toLowerCase();
    if (!notificationTypes.includes(notificationType)) {
      toast.error('Loại thông báo không hợp lệ');
      return;
    }
    setEditingNotification(notification.notification_id);
    setEditContent(notification.content);
    setEditIsActive(notification.is_active);
    setEditType(notificationType);
    setEditImageUrl(notification.image_url || '');
    setEditImage(null);
  };

  const handleUpdateNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        toast.error('ID thông báo không hợp lệ');
        return;
      }

      if (!editContent.trim()) {
        toast.error('Nội dung thông báo không được để trống');
        return;
      }

      const normalizedType = String(editType).toLowerCase();
      if (!notificationTypes.includes(normalizedType)) {
        toast.error('Loại thông báo không hợp lệ');
        return;
      }

      let imageUrl = editImageUrl;
      if (editImage) {
        imageUrl = await handleImageUpload(editImage);
      }

      const requestData = {
        content: editContent.trim(),
        is_active: Boolean(editIsActive),
        type: normalizedType,
        image_url: imageUrl || null
      };

      console.log('Update Request Data:', requestData);
      const response = await fetch(`${API_BASE}/admin/action/user-notification/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Update Error:', errorData);
        console.log('Request Data:', requestData);
        throw new Error(errorData.detail || 'Không thể cập nhật thông báo');
      }

      await fetchNotifications();
      setEditingNotification(null);
      setEditContent('');
      setEditImage(null);
      setEditImageUrl('');
      toast.success('Cập nhật thông báo thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể cập nhật thông báo';
      toast.error(errorMessage);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        toast.error('ID thông báo không hợp lệ');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/action/user-notification/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể xóa thông báo');
      }

      await fetchNotifications();
      toast.success('Xóa thông báo thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể xóa thông báo';
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/admin/action/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể tải lên hình ảnh');
      }
      const data = await response.json();
      return data.image_url;
    } catch (err) {
      const errorMessage = err.message || 'Không thể tải lên hình ảnh';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleCreateNotification = async () => {
    try {
      if (!newNotification.content.trim()) {
        toast.error('Nội dung thông báo không được để trống');
        return;
      }

      const normalizedType = String(newNotification.type).toLowerCase();
      if (!notificationTypes.includes(normalizedType)) {
        toast.error('Loại thông báo không hợp lệ');
        return;
      }

      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const requestData = {
        content: newNotification.content.trim(),
        type: normalizedType,
        is_active: Boolean(newNotification.is_active),
        image_url: imageUrl || null
      };

      console.log('Create Request Data:', requestData);
      const response = await fetch(`${API_BASE}/admin/action/user-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Create Error:', errorData);
        throw new Error(errorData.detail || 'Không thể tạo thông báo');
      }

      await fetchNotifications();
      setShowCreateForm(false);
      setNewNotification({ content: '', type: 'update', is_active: true, image_url: '' });
      setSelectedImage(null);
      toast.success('Tạo thông báo thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể tạo thông báo';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
          <p className="mt-4 text-base text-gray-600">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-md">
      <ToastContainer />
      <div className="bg-white border-b text-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center space-x-2 text-base">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-md" >Trang chủ</Link>
            <ChevronRight className="text-gray-400" size={16} />
            <span className="text-gray-900 text-md">Thông báo người dùng</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thông báo người dùng</h1>
          <p className="mt-1 font-bold text-md text-red-500">
            * Lưu ý chỉ duy nhất 1 thông báo được kích hoạt, tránh thông báo spam nhiều nội dung
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            {showCreateForm ? 'Hủy tạo mới' : 'Tạo thông báo mới'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tạo thông báo mới</h2>
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700">Hình ảnh</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedImage(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {selectedImage && (
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">{selectedImage.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700">Nội dung</label>
                  <textarea
                    value={newNotification.content}
                    onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                    rows="3"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700">Loại</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newNotification.is_active}
                      onChange={(e) => setNewNotification({ ...newNotification, is_active: e.target.checked })}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Kích hoạt</label>
                  </div>
                </div>
                <button
                  onClick={handleCreateNotification}
                  className="w-full px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  Tạo thông báo
                </button>
              </div>
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
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Nội dung</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-blue-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.map((notification) => (
                <tr key={notification.notification_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base text-gray-900">{notification.notification_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingNotification === notification.notification_id ? (
                      <div className="space-y-2">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-base font-medium text-gray-700">Hình ảnh</label>
                            <div className="mt-1 flex items-center space-x-4">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditImage(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                              />
                              {(editImage || editImageUrl) && (
                                <div className="flex items-center space-x-2">
                                  <ImageIcon className="h-5 w-5 text-gray-400" />
                                  <span className="text-sm text-gray-500">
                                    {editImage ? editImage.name : 'Current image'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            rows="3"
                          />
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editIsActive}
                                onChange={(e) => setEditIsActive(e.target.checked)}
                                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 text-base text-gray-700">Kích hoạt</label>
                            </div>
                            <div>
                              <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              >
                                {notificationTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-base text-gray-900">{notification.content}</div>
                        <div className="mt-1 text-sm text-gray-500 font-bold">
                          Trạng thái: <span className={notification.is_active ? 'text-green-600' : 'text-red-600'}>{notification.is_active ? 'Đang kích hoạt' : 'Không kích hoạt'}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base text-gray-500">
                      {notification.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {notification.image_url ? (
                      <div className="mb-2">
                        <img
                          width={100}
                          src={`${API_BASE}${notification.image_url}`}
                          alt="Notification"
                          className="max-w-xs rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="text-base text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                    {editingNotification === notification.notification_id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateNotification(notification.notification_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotification(null);
                            setEditContent('');
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => startEditing(notification)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification.notification_id)}
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

export default Notification;
