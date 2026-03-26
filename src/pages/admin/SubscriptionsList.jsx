import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Search, Filter, X, CreditCard, User, Package, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedSub, setSelectedSub] = useState(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/vip/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { class: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />, label: 'Hoàn thành' },
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3.5 h-3.5 mr-1" />, label: 'Đang chờ' },
      reject: { class: 'bg-red-100 text-red-800', icon: <XCircle className="w-3.5 h-3.5 mr-1" />, label: 'Đã hủy' },
    };
    const c = config[status] || { class: 'bg-gray-100 text-gray-800', icon: null, label: status };
    return (
      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${c.class}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  const filteredSubscriptions = subscriptions
    .filter(sub => {
      // Only show completed/successful subscriptions
      if (filterStatus === 'all') return sub.payment_status === 'completed';
      return sub.payment_status === filterStatus;
    })
    .filter(sub =>
      sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.package.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting specifically
      if (sortConfig.key === 'created_at' || sortConfig.key === 'start_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubscriptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Gói VIP đã đăng ký</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gói VIP đã đăng ký</h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý và theo dõi các gói VIP người dùng đã đăng ký
              </p>
            </div>
            <button
              onClick={fetchSubscriptions}
              className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo email hoặc tên gói..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="pending">Đang chờ</option>
                <option value="reject">Đã từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">Thông tin người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">Chi tiết gói</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">Trạng thái</th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ngày tạo</span>
                      <div className="flex flex-col">
                        <span className={`text-[10px] leading-none ${sortConfig.key === 'created_at' && sortConfig.direction === 'asc' ? 'text-blue-700' : 'text-gray-400'}`}>▲</span>
                        <span className={`text-[10px] leading-none ${sortConfig.key === 'created_at' && sortConfig.direction === 'desc' ? 'text-blue-700' : 'text-gray-400'}`}>▼</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedSub(sub)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sub.user_email}</div>
                      <div className="text-xs text-gray-500">{sub.username || `ID: ${sub.user_id}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.package.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {sub.package.package_type === 'all_skills' ? 'All Skills' : 'Single Skill'}
                        </span>
                        {sub.package.skill_type && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {sub.package.skill_type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{parseInt(sub.package.price).toLocaleString('vi-VN')}₫</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(sub.start_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        đến {formatDate(sub.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentItems.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-600">Không tìm thấy gói đăng ký nào.</p>
              </div>
            )}

            {filteredSubscriptions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Hiển thị {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, filteredSubscriptions.length)} trong tổng số {filteredSubscriptions.length} gói đăng ký
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;

                    if (totalPages <= maxVisiblePages + 2) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first page
                      pages.push(1);

                      // Calculate start and end of middle range
                      let start = Math.max(2, currentPage - 1);
                      let end = Math.min(totalPages - 1, currentPage + 1);

                      // Adjust if near the beginning
                      if (currentPage <= 3) {
                        start = 2;
                        end = 4;
                      }

                      // Adjust if near the end
                      if (currentPage >= totalPages - 2) {
                        start = totalPages - 3;
                        end = totalPages - 1;
                      }

                      // Add ellipsis before middle range if needed
                      if (start > 2) {
                        pages.push('...');
                      }

                      // Add middle range
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      // Add ellipsis after middle range if needed
                      if (end < totalPages - 1) {
                        pages.push('...');
                      }

                      // Always show last page
                      pages.push(totalPages);
                    }

                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-md text-sm font-medium ${currentPage === page
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden" onClick={() => setSelectedSub(null)}>
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div
            className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-xl shrink-0">
              <h3 className="text-lg font-semibold text-white">Chi tiết đăng ký</h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(selectedSub.payment_status)}
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <User className="w-4 h-4 text-violet-500 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">Thông tin người dùng</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tên:</span>
                    <span className="font-medium text-gray-900 break-all ml-4 text-right">{selectedSub.username || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900 break-all ml-4 text-right">{selectedSub.user_email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">User ID:</span>
                    <span className="font-medium text-gray-900">{selectedSub.user_id}</span>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <Package className="w-4 h-4 text-violet-500 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">Thông tin gói</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tên gói:</span>
                    <span className="font-medium text-gray-900 text-right ml-4">{selectedSub.package.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Loại:</span>
                    <span className="font-medium text-gray-900 text-right ml-4">
                      {selectedSub.package.package_type === 'all_skills' ? 'All Skills' : 'Single Skill'}
                      {selectedSub.package.skill_type && ` - ${selectedSub.package.skill_type}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Thời hạn:</span>
                    <span className="font-medium text-gray-900">{selectedSub.package.duration_months} tháng</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Giá gói:</span>
                    <span className="font-medium text-gray-900">{parseInt(selectedSub.package.price).toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-4 h-4 text-violet-500 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">Thanh toán</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {selectedSub.transaction ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Phương thức:</span>
                        <span className="font-medium text-gray-900 uppercase">{selectedSub.transaction.payment_method}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-medium text-green-600 font-semibold">{parseInt(selectedSub.transaction.amount).toLocaleString('vi-VN')}₫</span>
                      </div>
                      {selectedSub.transaction.payos_order_code && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Mã đơn PayOS:</span>
                          <span className="font-medium text-gray-900 font-mono text-xs">{selectedSub.transaction.payos_order_code}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Trạng thái:</span>
                        <div className="ml-4">{getStatusBadge(selectedSub.transaction.status)}</div>
                      </div>
                      {selectedSub.transaction.admin_note && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800 break-words">
                          <span className="font-semibold block mb-1">Ghi chú:</span> {selectedSub.transaction.admin_note}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 italic text-center py-2">Không có thông tin giao dịch</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <Calendar className="w-4 h-4 text-violet-500 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">Thời gian</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ngày đăng ký:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedSub.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bắt đầu:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedSub.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Kết thúc:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedSub.end_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
