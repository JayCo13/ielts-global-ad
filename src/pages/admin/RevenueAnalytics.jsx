import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Sun, Moon, BarChart3, FileText, Minus } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { vndAsUsd } from '../../utils/money';

function RevenueAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    // Revenue is collected in VND (PayOS) and shown in USD at the site's fixed rate.
    return vndAsUsd(amount);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/vip/dashboard/revenue-detail`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (!response.ok) throw new Error('Fetch failed');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching revenue detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ChangeTag = ({ percent }) => {
    if (percent === null || percent === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          <Minus className="w-3 h-3" /> N/A
        </span>
      );
    }
    const isUp = percent >= 0;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
        }`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}{percent}%
      </span>
    );
  };

  const StatCard = ({ icon: Icon, iconBg, title, currentLabel, currentValue, prevLabel, prevValue, changePercent, badge }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${iconBg} rounded-xl`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
              {badge && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <FileText className="w-2.5 h-2.5" /> {badge}
                </span>
              )}
            </div>
          </div>
          <ChangeTag percent={changePercent} />
        </div>

        <div className="space-y-3">
          {/* Current period */}
          <div className="bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/30 dark:to-transparent rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{currentLabel}</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(currentValue)}
            </div>
          </div>

          {/* Previous period */}
          <div className="rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-600">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{prevLabel}</div>
            <div className="text-lg font-bold text-gray-500 dark:text-gray-400">
              {formatCurrency(prevValue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Phân tích Doanh thu
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    Thống kê chi tiết doanh thu theo ngày, tháng, quý và năm
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : data ? (
              <>
                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                  <StatCard
                    icon={Sun}
                    iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    title="Hôm nay"
                    currentLabel="Doanh thu hôm nay"
                    currentValue={data.daily.today}
                    prevLabel="Hôm qua"
                    prevValue={data.daily.yesterday}
                    changePercent={data.daily.change_percent}
                  />
                  <StatCard
                    icon={Calendar}
                    iconBg="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    title="Tháng này"
                    currentLabel={data.monthly.current_month_label}
                    currentValue={data.monthly.current_month}
                    prevLabel={data.monthly.previous_month_label}
                    prevValue={data.monthly.previous_month}
                    changePercent={data.monthly.change_percent}
                  />
                  <StatCard
                    icon={BarChart3}
                    iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    title="Quý hiện tại"
                    currentLabel={data.quarterly.current_quarter_label}
                    currentValue={data.quarterly.current_quarter}
                    prevLabel={data.quarterly.previous_quarter_label}
                    prevValue={data.quarterly.previous_quarter}
                    changePercent={data.quarterly.change_percent}
                    badge="Dùng cho kê khai thuế"
                  />
                  <StatCard
                    icon={DollarSign}
                    iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    title="Năm nay"
                    currentLabel={data.yearly.current_year_label}
                    currentValue={data.yearly.current_year}
                    prevLabel={data.yearly.previous_year_label}
                    prevValue={data.yearly.previous_year}
                    changePercent={data.yearly.change_percent}
                  />
                </div>

                {/* Quarterly Breakdown Table */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bảng doanh thu theo Quý</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dữ liệu tổng hợp cho kê khai thuế — tất cả các năm</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left">Năm</th>
                          <th className="px-6 py-4 text-left">Quý</th>
                          <th className="px-6 py-4 text-left">Tháng</th>
                          <th className="px-6 py-4 text-right">Doanh thu</th>
                          <th className="px-6 py-4 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.quarterly.quarter_breakdown.map((row, i) => {
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const currentQ = Math.ceil((now.getMonth() + 1) / 3);
                          const isCurrent = row.year === currentYear && row.quarter_number === currentQ;
                          const isPast = row.year < currentYear || (row.year === currentYear && row.quarter_number < currentQ);

                          return (
                            <tr key={i} className={`transition-colors ${isCurrent
                              ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                              : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                              }`}>
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-900 dark:text-white">{row.year}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${isCurrent
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                  {row.quarter}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                {row.months}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`text-base font-extrabold ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                                  }`}>
                                  {formatCurrency(row.revenue)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {isCurrent ? (
                                  <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    Đang chạy
                                  </span>
                                ) : isPast ? (
                                  <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    Đã kết thúc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    Sắp tới
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Yearly totals */}
                        {(() => {
                          const years = [...new Set(data.quarterly.quarter_breakdown.map(r => r.year))];
                          return years.map(year => {
                            const yearTotal = data.quarterly.quarter_breakdown
                              .filter(r => r.year === year)
                              .reduce((sum, r) => sum + r.revenue, 0);
                            return (
                              <tr key={`total-${year}`} className="bg-gray-50 dark:bg-gray-700/40 border-t-2 border-gray-200 dark:border-gray-600">
                                <td className="px-6 py-4">
                                  <span className="font-extrabold text-gray-900 dark:text-white">{year}</span>
                                </td>
                                <td colSpan="2" className="px-6 py-4">
                                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tổng năm {year}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(yearTotal)}
                                  </span>
                                </td>
                                <td className="px-6 py-4"></td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                Không thể tải dữ liệu doanh thu
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default RevenueAnalytics;
