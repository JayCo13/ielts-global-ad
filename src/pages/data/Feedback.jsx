import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, AlertCircle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import API_BASE from '../../config/api';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newFeedback, setNewFeedback] = useState({
    content: '',
    image_url: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/action/feedbacks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) throw new Error('Không thể lấy phản hồi');
      const data = await response.json();
      setFeedbacks(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải phản hồi. Vui lòng thử lại sau.');
      toast.error('Không thể tải phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (feedback) => {
    setEditingFeedback(feedback.feedback_id);
    setEditContent(feedback.content);
    setEditImageUrl(feedback.image_url || '');
    setEditImage(null);
  };

  const handleUpdateFeedback = async (feedbackId) => {
    try {
      if (!feedbackId) {
        toast.error('ID phản hồi không hợp lệ');
        return;
      }

      if (!editContent.trim()) {
        toast.error('Nội dung phản hồi không được để trống');
        return;
      }

      let imageUrl = editImageUrl;
      if (editImage) {
        imageUrl = await handleImageUpload(editImage);
      }

      const requestData = {
        content: editContent.trim(),
        image_url: imageUrl || null
      };

      const response = await fetch(`${API_BASE}/admin/action/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể cập nhật phản hồi');
      }

      await fetchFeedbacks();
      setEditingFeedback(null);
      setEditContent('');
      setEditImage(null);
      setEditImageUrl('');
      toast.success('Cập nhật phản hồi thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể cập nhật phản hồi';
      toast.error(errorMessage);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      if (!feedbackId) {
        toast.error('ID phản hồi không hợp lệ');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/action/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể xóa phản hồi');
      }

      await fetchFeedbacks();
      toast.success('Xóa phản hồi thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể xóa phản hồi';
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/admin/action/upload-feedback-image`, {
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

  const handleCreateFeedback = async () => {
    try {
      if (!newFeedback.content.trim()) {
        toast.error('Nội dung phản hồi không được để trống');
        return;
      }

      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const requestData = {
        content: newFeedback.content.trim(),
        image_url: imageUrl || null
      };

      const response = await fetch(`${API_BASE}/admin/action/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể tạo phản hồi');
      }

      await fetchFeedbacks();
      setShowCreateForm(false);
      setNewFeedback({ content: '', image_url: '' });
      setSelectedImage(null);
      toast.success('Tạo phản hồi thành công');
    } catch (err) {
      const errorMessage = err.message || 'Không thể tạo phản hồi';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
          <p className="mt-4 text-base text-gray-600">Đang tải phản hồi...</p>
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
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-md">Trang chủ</Link>
            <ChevronRight className="text-gray-400" size={16} />
            <span className="text-gray-900 text-md">Quản lý phản hồi</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý phản hồi</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            {showCreateForm ? 'Hủy tạo mới' : 'Tạo phản hồi mới'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tạo phản hồi mới</h2>
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
                  value={newFeedback.content}
                  onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  rows="3"
                />
              </div>
              <button
                onClick={handleCreateFeedback}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Tạo phản hồi
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
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Nội dung</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-blue-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-blue-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <tr key={feedback.feedback_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base text-gray-900">{feedback.feedback_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingFeedback === feedback.feedback_id ? (
                      <div className="space-y-2">
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
                      </div>
                    ) : (
                      <div className="text-base text-gray-900">{feedback.content}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {feedback.image_url ? (
                      <div className="mb-2">
                        <img
                          width={100}
                          src={`${API_BASE}${feedback.image_url}`}
                          alt="Feedback"
                          className="max-w-xs rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="text-base text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                    {editingFeedback === feedback.feedback_id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateFeedback(feedback.feedback_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => {
                            setEditingFeedback(null);
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
                          onClick={() => startEditing(feedback)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(feedback.feedback_id)}
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

export default Feedback;
