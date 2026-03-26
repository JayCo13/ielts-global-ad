import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  InboxIcon
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const PendingTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [filter, setFilter] = useState('all');
  const sortedAndFilteredTransactions = transactions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .filter(tx => {
      if (filter === 'new') {
        const isNew = new Date() - new Date(tx.created_at) < 24 * 60 * 60 * 1000; // 24 hours
        return isNew;
      }
      if (filter === 'unprocessed') {
        return tx.processing_time && new Date() - new Date(tx.created_at) > 24 * 60 * 60 * 1000;
      }
      return true;
    });
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fetch pending transactions
  const fetchPendingTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/vip/transactions/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransactions();
  }, []);
  useEffect(() => {
    // Initial fetch
    fetchPendingTransactions();

    // Set up polling interval (every 10 seconds)
    const pollInterval = setInterval(() => {
      fetchPendingTransactions();
    }, 10000);

    // Cleanup on component unmount
    return () => clearInterval(pollInterval);
  }, []);
  const handleApprove = (transaction) => {
    setCurrentTransaction(transaction);
    setAdminNote('');
    setShowApproveModal(true);
  };

  const handleReject = (transaction) => {
    setCurrentTransaction(transaction);
    setAdminNote('');
    setShowRejectModal(true);
  };

  const updateTransactionStatus = async (status) => {
    try {
      const formData = new FormData();
      formData.append('transaction_status', status === 'completed' ? 'completed' : 'reject'); // Changed from 'status' to 'transaction_status'
      formData.append('admin_note', adminNote);

      const response = await fetch(`${API_BASE}/admin/vip/transactions/${currentTransaction.transaction_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update transaction');
      }

      toast.success(`Transaction ${status === 'completed' ? 'approved' : 'rejected'} successfully!`);
      fetchPendingTransactions();
      setShowApproveModal(false);
      setShowRejectModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vn-VI', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewImage = (transaction) => {
    setCurrentTransaction(transaction);
    setShowImageModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Giao dịch chờ duyệt</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Giao dịch chờ duyệt</h1>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <p className="text-sm text-gray-500">
                  Tự động cập nhật mỗi 10 giây
                </p>
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'new'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Giao dịch mới (24h)
              </button>
              <button
                onClick={() => setFilter('unprocessed')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'unprocessed'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Chưa xử lý ({'>'}24h)
              </button>
            </div>

          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading transactions...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No pending transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Người dùng
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Gói VIP
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Phương thức thanh toán
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Mã giao dịch
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Hình ảnh chuyển khoản
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-blue-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((tx) => {
                        const isNew = new Date() - new Date(tx.created_at) < 24 * 60 * 60 * 1000;
                        const isUnprocessed = !tx.processing_time && new Date() - new Date(tx.created_at) > 24 * 60 * 60 * 1000;

                        return (
                          <tr
                            key={tx.transaction_id}
                            className={`${isNew
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : isUnprocessed
                                ? 'bg-yellow-50 hover:bg-yellow-100'
                                : 'hover:bg-gray-50'
                              } transition-colors duration-150`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {isNew && (
                                  <span className="mr-2 flex-shrink-0 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                                )}
                                <div className="text-sm text-gray-900">{tx.user_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tx.package_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${tx.amount.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tx.payment_method}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tx.transaction_code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tx.bank_transfer_image && (
                                <button
                                  onClick={() => handleViewImage(tx)}
                                  className="text-violet-600 hover:text-violet-900 p-1"
                                  title="View Image"
                                >
                                  <ExternalLink size={18} />
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleApprove(tx)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Approve"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => handleReject(tx)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Reject"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} transactions
                    </div>
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-3 py-1 text-sm rounded-md ${currentPage === number
                            ? 'bg-violet-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Approve Transaction Modal */}
      {showApproveModal && currentTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Duyệt giao dịch</h2>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn duyệt giao dịch từ <span className="font-semibold">{currentTransaction.user_email}</span> cho gói <span className="font-semibold">{currentTransaction.package_name}</span>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Note (Optional)
                </label>
                <textarea
                  value="Thanh toán thành công, Cảm ơn quý khác đã tin tưởng sử dụng gói VIP của chúng tôi!"
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Add a note (optional)"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateTransactionStatus('completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Transaction Modal */}
      {showRejectModal && currentTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Từ chối giao dịch</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn từ chối giao dịch từ <span className="font-semibold">{currentTransaction.user_email}</span>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do từ chối (Bắt buộc)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows="3"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Explain why this transaction is being rejected"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateTransactionStatus('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={!adminNote.trim()}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && currentTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl mx-4 h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center">
                <h2 className="text-lg text-center font-semibold text-gray-800 dark:text-gray-100">Bằng Chứng Thanh Toán</h2>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full overflow-hidden">
              {/* Left side - Image */}
              <div className="h-full flex flex-col">
                <div className="relative flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={`${API_BASE}${currentTransaction.bank_transfer_image}`}
                    alt="Bằng chứng thanh toán"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x300?text=Không+Tìm+Thấy+Hình+Ảnh';
                      toast.error("Không thể tải hình ảnh");
                    }}
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <a
                      href={`${API_BASE}${currentTransaction.bank_transfer_image}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800/70 hover:bg-gray-900 text-white p-1.5 rounded-full transition-colors"
                      aria-label="Xem hình ảnh gốc"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

              </div>

              {/* Right side - Transaction info */}
              <div className="h-full flex flex-col overflow-hidden">
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                      <p className="text-md font-medium text-gray-500 dark:text-gray-400">Người Dùng:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{currentTransaction.user_email}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                      <p className="text-md font-medium text-gray-500 dark:text-gray-400">Số Tiền:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentTransaction.amount * 23000)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                    <p className="text-md font-medium text-gray-500 dark:text-gray-400">Nội Dung Chuyển Khoản:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{currentTransaction.bank_description || "Không có nội dung"}</p>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      Ngân hàng: {currentTransaction.payment_method}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                    <p className="text-md font-medium text-gray-500 dark:text-gray-400">Ngày tạo:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(currentTransaction.created_at)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                    <p className="text-md font-medium text-gray-500 dark:text-gray-400">Tên gói:</p>
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{currentTransaction.package_name}</p>
                  </div>
                  {currentTransaction.user_note && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-md">
                      <p className="text-md font-medium text-gray-500 dark:text-gray-400">Ghi Chú Người Dùng</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{currentTransaction.user_note}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-md border-l-4 border-blue-500">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Lưu ý bảo mật</p>
                    <p className="text-sm text-blue-900 dark:text-blue-100">Vui lòng xác minh thông tin chuyển khoản và ảnh bằng chứng trước khi phê duyệt giao dịch này.</p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t dark:border-gray-700 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowImageModal(false);
                        handleApprove(currentTransaction);
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center transition-colors"
                    >
                      <Check size={16} className="mr-1.5" />
                      Phê Duyệt
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowImageModal(false);
                        handleReject(currentTransaction);
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center transition-colors"
                    >
                      <X size={16} className="mr-1.5" />
                      Từ Chối
                    </button>
                    <button
                      onClick={() => setShowImageModal(false)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      Đóng
                    </button>
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

export default PendingTransactions;
