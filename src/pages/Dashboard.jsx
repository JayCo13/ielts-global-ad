import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { UserCircle, RefreshCw, Users, Package, DollarSign, TrendingUp, Clock, AlertCircle, BookOpen, PenTool, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import API_BASE from '../config/api';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const notificationSound = useRef(new Audio('/sounds/notification.mp3'));
  const originalTitle = useRef(document.title);
  const [statistics, setStatistics] = useState({
    total_students: 0,
    active_students: 0,
    new_students: 0,
    total_attempts: 0,
    exam_types: {},
    recent_results: [],
    average_active_time: '0h',
    total_exams: 0,
    average_score: 'N/A',
    writing_tests: 0,
    speaking_tests: 0
  });
  const [packageStats, setPackageStats] = useState({
    summary: {
      total_packages: 0,
      active_packages: 0,
      total_subscriptions: 0,
      active_subscriptions: 0
    },
    package_statistics: [],
    recent_transactions: []
  });
  const [revenueStats, setRevenueStats] = useState({
    total_revenue: 0,
    today_revenue: 0,
    month_revenue: 0,
    year_revenue: 0,
    weekly_revenue: [],
    monthly_revenue: [],
    yearly_revenue: []
  });
  const [revenueTab, setRevenueTab] = useState('weekly');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const checkForNewData = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasNewNotifications) {
          setHasNewNotification(true);
          // Only play sound if the tab is not focused
          if (!document.hasFocus()) {
            notificationSound.current.play().catch(err => console.log('Audio playback failed:', err));
          }
          document.title = '(1) Thông báo mới - IELTS Practice';

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Hoạt động mới', {
              body: data.message || 'Bạn có thông báo mới',
              icon: '/favicon.ico',
              silent: true // Don't play the default notification sound
            });
          }

          // Show toast notification
          toast.success(data.message || 'Bạn có thông báo mới', {
            duration: 5000,
            position: 'top-right'
          });
        }
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  useEffect(() => {
    // Request notification permission when component mounts
    if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Initial check
    checkForNewData();

    // Check for new notifications every 30 seconds
    const interval = setInterval(checkForNewData, 30000);

    // Reset title when component unmounts
    return () => {
      clearInterval(interval);
      document.title = originalTitle.current;
    };
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // In fetchDashboardData function, add:
      const examsResponse = await fetch(`${API_BASE}/admin/dashboard/exams`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!examsResponse.ok) throw new Error('Không thể tải dữ liệu bài thi');
      const examsData = await examsResponse.json();
      setExams(examsData);
      // Fetch statistics
      const statsResponse = await fetch(`${API_BASE}/admin/dashboard/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!statsResponse.ok) throw new Error('Không thể tải dữ liệu thống kê');
      const statsData = await statsResponse.json();
      setStatistics(statsData);

      // Fetch package statistics
      const packagesResponse = await fetch(`${API_BASE}/admin/vip/dashboard/packages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!packagesResponse.ok) throw new Error('Không thể tải dữ liệu thống kê gói');
      const packagesData = await packagesResponse.json();
      setPackageStats(packagesData);

      // Fetch revenue statistics
      const revenueResponse = await fetch(`${API_BASE}/admin/vip/dashboard/revenue`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!revenueResponse.ok) throw new Error('Không thể tải dữ liệu doanh thu');
      const revenueData = await revenueResponse.json();
      setRevenueStats(revenueData);

      // Fetch students
      const studentsResponse = await fetch(`${API_BASE}/admin/dashboard/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!studentsResponse.ok) throw new Error('Không thể tải dữ liệu học viên');
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          hasNewNotification={hasNewNotification}
          setHasNewNotification={setHasNewNotification} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Dashboard Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0 space-y-1">
                <h1 className="text-2xl md:text-3xl text-gray-900 dark:text-white font-bold tracking-tight">Tổng quan Bảng điều khiển</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Theo dõi hiệu suất và số liệu của nền tảng</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                Làm mới
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* Revenue Section - Full Width */}
                <div className="col-span-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                        <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Doanh thu</h2>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 gap-1">
                      {[{ key: 'weekly', label: 'Tuần' }, { key: 'monthly', label: 'Tháng' }, { key: 'yearly', label: 'Năm' }].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setRevenueTab(tab.key)}
                          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${revenueTab === tab.key
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Revenue Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-gray-100 dark:border-gray-700">
                    {[
                      { label: 'Hôm nay', value: revenueStats.today_revenue || 0, color: 'text-blue-600' },
                      { label: 'Tháng này', value: revenueStats.month_revenue || 0, color: 'text-violet-600' },
                      { label: 'Năm nay', value: revenueStats.year_revenue || 0, color: 'text-amber-600' },
                      { label: 'Tổng cộng', value: revenueStats.total_revenue || 0, color: 'text-emerald-600' },
                    ].map((item, i) => (
                      <div key={i} className={`p-5 lg:p-6 ${i < 3 ? 'border-r border-gray-100 dark:border-gray-700' : ''} ${i < 2 ? 'border-b lg:border-b-0 border-gray-100 dark:border-gray-700' : i === 2 ? 'border-b lg:border-b-0 border-gray-100 dark:border-gray-700' : ''}`}>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{item.label}</div>
                        <div className={`text-lg lg:text-2xl font-extrabold ${item.color} dark:opacity-90 break-words`}>
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="p-4 lg:p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={
                        revenueTab === 'weekly'
                          ? (revenueStats.weekly_revenue || []).map(d => ({ name: d.week_start.slice(5), revenue: d.revenue }))
                          : revenueTab === 'monthly'
                            ? (revenueStats.monthly_revenue || []).map(d => ({ name: `T${d.month}`, revenue: d.revenue }))
                            : (revenueStats.yearly_revenue || []).map(d => ({ name: `${d.year}`, revenue: d.revenue }))
                      } margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                          formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Metrics Row - 3 remaining cards */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {/* Students Card */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-5 lg:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl shrink-0">
                        <Users className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-0.5 lg:mb-1 truncate" title="Học viên (HĐ/Tổng)">Học viên (HĐ/Tổng)</div>
                        <div className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-baseline truncate">
                          <span className="text-blue-600">{statistics.active_students}</span>
                          <span className="text-gray-400 text-lg lg:text-xl font-medium mx-1">/</span>
                          <span>{statistics.total_students}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exam Activity Card */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-5 lg:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2.5 lg:p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl shrink-0">
                        <BookOpen className="w-6 h-6 lg:w-7 lg:h-7 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-0.5 lg:mb-1 truncate">Bài thi đã làm</div>
                        <div className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                          {statistics.total_exams}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Average Score Card */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-5 lg:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2.5 lg:p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl shrink-0">
                        <PenTool className="w-6 h-6 lg:w-7 lg:h-7 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-0.5 lg:mb-1 truncate">Lần thử bài thi</div>
                        <div className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                          {statistics.total_attempts}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                  {/* Student Performance */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kết quả gần đây</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left">Học viên</th>
                            <th className="px-6 py-4 text-left">Bài thi</th>
                            <th className="px-6 py-4 text-center">Điểm</th>
                            <th className="px-6 py-4 text-right">Ngày hoàn thành</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {statistics.recent_results.map((result) => (
                            <tr key={result.result_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {result.student_name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {result.exam_title}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {result.score}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                {formatDate(result.completion_date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Exam Overview Table */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tổng quan bài thi</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left">Tiêu đề</th>
                            <th className="px-6 py-4 text-center">Loại</th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-center">Lần thử</th>
                            <th className="px-6 py-4 text-right">Ngày tạo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {exams.slice(0, 7).map((exam) => (
                            <tr key={exam.exam_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {exam.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-medium px-2.5 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg">
                                  {exam.section_types[0]}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg ${exam.is_active
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${exam.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  {exam.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                {exam.attempts}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                {formatDate(exam.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sidebar Content */}
                <div className="col-span-12 xl:col-span-4 space-y-6">
                  {/* Package Summary */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gói dịch vụ</h2>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {packageStats.package_statistics.map((pkg) => (
                          <div key={pkg.package_id} className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-xl transition-colors">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{pkg.name}</div>
                              <div className="text-sm font-medium text-gray-500 mt-0.5">{formatCurrency(pkg.price)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(pkg.revenue)}
                              </div>
                              <div className="text-xs font-semibold text-gray-500 mt-1 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600 inline-block">
                                {pkg.paid_subscriptions}/{pkg.total_subscriptions} subs
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Giao dịch gần đây</h2>
                    </div>
                    <div className="p-2">
                      <div className="overflow-y-auto max-h-[500px]">
                        {packageStats.recent_transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.transaction_id} className="p-4 mx-2 my-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div className="pr-2">
                                <div className="font-bold text-gray-900 dark:text-white text-sm">{transaction.user_email}</div>
                                <div className="text-xs font-medium text-gray-500 mt-1 pl-0 ml-0 flex items-center">
                                  <Package className="w-3 h-3 mr-1" />
                                  <span className="truncate max-w-[140px] inline-block">{transaction.package_name}</span>
                                </div>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <div className="font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-xs font-medium text-gray-500 mt-1">{formatDate(transaction.created_at)}</div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md ${transaction.status === 'completed'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                {transaction.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
