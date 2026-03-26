import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, AlertCircle, Home, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import PackageFormModal from '../../components/forms/PackageFormModal';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const VIPPackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const navigate = useNavigate();

  // Fetch all packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/vip/packages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu gói dịch vụ');
      }

      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = () => {
    setShowCreateModal(true);
  };

  const handleEditPackage = (pkg) => {
    setCurrentPackage(pkg);
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleToggleStatus = async (pkg) => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        name: pkg.name,
        price: pkg.price,
        description: pkg.description || '',
        is_active: (!pkg.is_active).toString(),
        package_type: pkg.package_type,
        duration_months: pkg.duration_months.toString()
      });

      // Add skill_type if package is single_skill
      if (pkg.package_type === 'single_skill' && pkg.skill_type) {
        params.append('skill_type', pkg.skill_type);
      }

      const url = `${API_BASE}/admin/vip/packages/${pkg.package_id}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể cập nhật trạng thái gói');
      }

      toast.success(pkg.is_active ? 'Đã vô hiệu hóa gói thành công!' : 'Đã kích hoạt gói thành công!');
      fetchPackages();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Breadcrumb Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-gray-400 hover:text-violet-600 transition-colors">
              <Home size={20} />
            </Link>

            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-violet-600 dark:text-violet-400">
              Quản lý gói VIP
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý gói VIP</h1>
          <button
            onClick={handleCreatePackage}
            className="px-4 py-2 bg-violet-600 text-white rounded-md flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Tạo gói mới
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu gói...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên gói</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỹ năng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      Không tìm thấy gói dịch vụ nào. Hãy tạo gói đầu tiên của bạn!
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.package_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>

                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.package_type === 'all_skills' ? 'Tất cả kỹ năng' : 'Một kỹ năng'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.duration_months} {pkg.duration_months === 1 ? 'tháng' : 'tháng'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${pkg.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {pkg.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pkg.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditPackage(pkg)}
                            className="p-1 text-violet-600 hover:text-violet-900 rounded-md hover:bg-violet-50"
                            title="Chỉnh sửa gói"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            className={`p-1 rounded-md ${pkg.is_active
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                            title={pkg.is_active ? 'Vô hiệu hóa gói' : 'Kích hoạt gói'}
                          >
                            {pkg.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <PackageFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchPackages();
            setShowCreateModal(false);
          }}
          isCreate={true}
        />
      )}

      {/* Edit Package Modal */}
      {showEditModal && currentPackage && (
        <PackageFormModal
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchPackages();
            setShowEditModal(false);
          }}
          isCreate={false}
          packageData={currentPackage}
        />
      )}
    </div>
  );
};

export default VIPPackageManagement;
