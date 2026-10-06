import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { RefreshCw, Check, Trash2, Eye, EyeOff, InboxIcon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

const ERROR_TYPE_LABELS = {
  wrong_answer: 'Đáp án sai',
  mis_graded: 'Chấm đáp án chưa chính xác',
  spelling: 'Lỗi chính tả',
  audio: 'Lỗi âm thanh',
  audio_cue: 'Nghe lại nhảy sai đoạn',
  ui: 'Lỗi giao diện hiển thị',
  other: 'Khác',
};

const ErrorReports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [unviewed, setUnviewed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unviewed'); // 'all' | 'unviewed' | 'viewed'

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/admin/error-reports?limit=200`;
      if (filter === 'unviewed') url += '&is_viewed=false';
      if (filter === 'viewed') url += '&is_viewed=true';
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error('Không tải được danh sách báo lỗi');
      const data = await res.json();
      setReports(data.items || []);
      setUnviewed(data.unviewed || 0);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const toggleViewed = async (report) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/error-reports/${report.report_id}/viewed?is_viewed=${!report.is_viewed}`,
        { method: 'PATCH', headers: authHeaders }
      );
      if (!res.ok) throw new Error('Cập nhật thất bại');
      toast.success(!report.is_viewed ? 'Đã đánh dấu đã xem' : 'Đã bỏ đánh dấu');
      fetchReports();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteReport = async (report) => {
    if (!window.confirm('Xóa báo lỗi này?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/error-reports/${report.report_id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Xóa thất bại');
      toast.success('Đã xóa');
      fetchReports();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('vi-VN');
    } catch {
      return iso;
    }
  };

  const FilterTab = ({ value, label }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        filter === value
          ? 'bg-[#0096b1] text-white'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {label}
      {value === 'unviewed' && unviewed > 0 && (
        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
          {unviewed}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <ToastContainer position="top-right" autoClose={2500} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                Báo lỗi từ khách hàng
              </h1>
              <button
                onClick={fetchReports}
                className="btn bg-[#0096b1] text-white hover:bg-[#007a90] mt-4 sm:mt-0 flex items-center gap-2"
              >
                <RefreshCw size={16} /> Làm mới
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <FilterTab value="unviewed" label="Chưa xem" />
              <FilterTab value="viewed" label="Đã xem" />
              <FilterTab value="all" label="Tất cả" />
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Đang tải...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
                <InboxIcon size={48} />
                <span>Không có báo lỗi nào</span>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((r) => (
                  <div
                    key={r.report_id}
                    className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl border ${
                      r.is_viewed
                        ? 'border-gray-100 dark:border-gray-700/60'
                        : 'border-[#0096b1]/40'
                    } p-5`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">
                            {r.exam_title || `Đề #${r.exam_id ?? '?'}`}
                          </span>
                          {r.skill && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                              {r.skill}
                            </span>
                          )}
                          {!r.is_viewed && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium">
                              Mới
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.username || 'Ẩn danh'}
                          {r.email ? ` · ${r.email}` : ''} · {formatDate(r.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleViewed(r)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                            r.is_viewed
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              : 'bg-[#0096b1] text-white hover:bg-[#007a90]'
                          }`}
                        >
                          {r.is_viewed ? <EyeOff size={15} /> : <Check size={15} />}
                          {r.is_viewed ? 'Bỏ đã xem' : 'Đã xem'}
                        </button>
                        <button
                          onClick={() => deleteReport(r)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(r.error_types || []).map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-xs rounded-md bg-[#eb7e37]/10 text-[#c15f1e] font-medium"
                        >
                          {ERROR_TYPE_LABELS[t] || t}
                        </span>
                      ))}
                    </div>

                    {(r.wrong_answer_questions || r.mis_graded_questions) && (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {r.wrong_answer_questions && (
                          <div>
                            <span className="font-medium">Câu có đáp án sai:</span>{' '}
                            {r.wrong_answer_questions}
                          </div>
                        )}
                        {r.mis_graded_questions && (
                          <div>
                            <span className="font-medium">Câu bị chấm sai:</span>{' '}
                            {r.mis_graded_questions}
                          </div>
                        )}
                      </div>
                    )}

                    {r.description && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3 whitespace-pre-wrap">
                        {r.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ErrorReports;
