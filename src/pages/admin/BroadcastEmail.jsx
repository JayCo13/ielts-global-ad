import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { ArrowLeft, Mail, Send, Eye, Clock, CheckCircle, XCircle, AlertCircle, Image, Users, History, X, Upload } from 'lucide-react';
import { API_BASE } from '../../config/api';

// SES list price: $0.10 per 1,000 emails = $0.0001 per recipient.
const SES_COST_PER_EMAIL_USD = 0.0001;
const formatCostUSD = (n) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(2)}`;

function BroadcastEmail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [images, setImages] = useState([]); // [{url, filename, preview}]
  const [targetFilter, setTargetFilter] = useState('non_vip');
  const [recipientCount, setRecipientCount] = useState(null);

  // Status state
  const [sending, setSending] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);

  // Convert plain text + images to HTML
  const buildHtml = () => {
    // Convert line breaks to <br>, wrap in styled container
    const textHtml = bodyText
      .split('\n')
      .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#333;">${line}</p>`)
      .join('\n');

    const imagesHtml = images.map(img =>
      `<img src="${img.url.startsWith('http') ? img.url : API_BASE + img.url}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;display:block;" />`
    ).join('\n');

    return `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:20px;">
        ${textHtml}
        ${imagesHtml ? `<div style="margin-top:16px;">${imagesHtml}</div>` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 16px;" />
        <p style="font-size:12px;color:#999;text-align:center;">IELTS Computer Test — englishoncomputer.com</p>
      </div>
    `.trim();
  };

  // Fetch recipient count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/email/recipients-count?target_filter=${targetFilter}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecipientCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching count:', err);
      }
    };
    fetchCount();
  }, [targetFilter]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (broadcastStatus?.active) {
      pollingRef.current = setInterval(fetchStatus, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [broadcastStatus?.active]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/email/broadcast/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastStatus(data);
        if (!data.active && pollingRef.current) {
          clearInterval(pollingRef.current);
          fetchHistory();
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/email/broadcast/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/admin/email/upload-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, {
            url: data.url,
            filename: data.filename,
            preview: URL.createObjectURL(file)
          }]);
        } else {
          alert('Upload ảnh thất bại');
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Lỗi upload ảnh');
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendBroadcast = async () => {
    if (!subject.trim() || !bodyText.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung email');
      return;
    }
    const estimatedCost = recipientCount ? formatCostUSD(recipientCount * SES_COST_PER_EMAIL_USD) : '?';
    if (!window.confirm(`Bạn có chắc chắn muốn gửi email đến ${recipientCount?.toLocaleString()} người dùng?\n\nChi phí AWS SES ước tính: ${estimatedCost}`)) return;

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/email/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, body_html: buildHtml(), target_filter: targetFilter })
      });
      if (res.ok) {
        fetchStatus();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to start broadcast');
      }
    } catch (err) {
      alert('Error starting broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!subject.trim() || !bodyText.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung email');
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, body_html: buildHtml(), target_filter: targetFilter })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to send test email');
      }
    } catch (err) {
      alert('Error sending test email');
    } finally {
      setTestSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Đang chờ' },
      sending: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send, label: 'Đang gửi' },
      completed: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Hoàn thành' },
      failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Thất bại' }
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.color}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/20">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Gửi Email Hàng Loạt
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    Soạn và gửi email thông báo đến người dùng
                  </p>
                </div>
              </div>
            </div>

            {/* Active Broadcast Status */}
            {broadcastStatus?.active && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-300">Đang gửi email...</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                  <strong>{broadcastStatus.subject}</strong>
                </p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: broadcastStatus.total_recipients ? `${Math.round(((broadcastStatus.sent_count + broadcastStatus.failed_count) / broadcastStatus.total_recipients) * 100)}%` : '0%' }}
                  ></div>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {broadcastStatus.sent_count} đã gửi</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">✗ {broadcastStatus.failed_count} lỗi</span>
                  <span className="text-gray-600 dark:text-gray-400">/ {broadcastStatus.total_recipients} tổng</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('compose')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'compose'
                  ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <Send className="w-4 h-4" /> Soạn Email
              </button>
              <button
                onClick={() => { setActiveTab('history'); fetchHistory(); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history'
                  ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <History className="w-4 h-4" /> Lịch sử gửi
              </button>
            </div>

            {activeTab === 'compose' ? (
              <div className="space-y-6">
                {/* Target filter */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1.5" />
                    Đối tượng gửi
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { value: 'non_vip', label: 'Chưa có VIP' },
                      { value: 'vip', label: 'Đã có VIP' },
                      { value: 'all', label: 'Tất cả' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTargetFilter(opt.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${targetFilter === opt.value
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-violet-400'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {recipientCount !== null && (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      📧 Sẽ gửi đến <strong className="text-violet-600 dark:text-violet-400">{recipientCount.toLocaleString()}</strong> người dùng
                      {' · '}
                      <span title="SES list price: $0.10 / 1,000 emails">
                        Chi phí ước tính: <strong className="text-violet-600 dark:text-violet-400">{formatCostUSD(recipientCount * SES_COST_PER_EMAIL_USD)}</strong>
                      </span>
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu đề email
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Nhập tiêu đề email..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  />
                </div>

                {/* Body - Plain text */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung email
                  </label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={10}
                    placeholder="Nhập nội dung email tại đây...&#10;&#10;Ví dụ:&#10;Xin chào bạn!&#10;&#10;Chúng mình có tin vui muốn chia sẻ..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm leading-relaxed"
                  />
                </div>

                {/* Image upload */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    <Image className="w-4 h-4 inline mr-1.5" />
                    Hình ảnh đính kèm
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy tính'}
                  </button>

                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img
                            src={img.preview}
                            alt={`Uploaded ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> {showPreview ? 'Ẩn xem trước' : 'Xem trước email'}
                  </button>

                  {showPreview && (bodyText || images.length > 0) && (
                    <div className="mt-4 border border-gray-200 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
                      <div className="text-xs text-gray-400 mb-1">Subject:</div>
                      <div className="font-bold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                        {subject || '(Chưa có tiêu đề)'}
                      </div>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: buildHtml() }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSendTest}
                    disabled={testSending || !subject || !bodyText}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border-2 border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {testSending ? 'Đang gửi test...' : 'Gửi thử (đến email admin)'}
                  </button>
                  <button
                    onClick={handleSendBroadcast}
                    disabled={sending || broadcastStatus?.active || !subject || !bodyText}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4" />
                    {sending ? 'Đang khởi tạo...' : broadcastStatus?.active ? 'Đang có broadcast chạy...' : `Gửi đến ${recipientCount?.toLocaleString() || '...'} người`}
                  </button>
                </div>

                {/* SES warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Lưu ý:</strong> Gửi qua AWS SES (giá $0.10 / 1.000 email). Mỗi broadcast giới hạn 30.000 người nhận và hệ thống tự động gửi theo batch để tuân thủ rate limit của SES.
                  </div>
                </div>
              </div>
            ) : (
              /* History Tab */
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử gửi email</h2>
                </div>
                {history.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Chưa có lịch sử gửi email nào
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left">Tiêu đề</th>
                          <th className="px-6 py-4 text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-center">Đã gửi</th>
                          <th className="px-6 py-4 text-center">Lỗi</th>
                          <th className="px-6 py-4 text-center">Tổng</th>
                          <th className="px-6 py-4 text-left">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {history.map(h => (
                          <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{h.subject}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {h.target_filter === 'non_vip' ? 'Chưa VIP' : h.target_filter === 'vip' ? 'VIP' : 'Tất cả'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">{getStatusBadge(h.status)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{h.sent_count}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-red-600 dark:text-red-400">{h.failed_count}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-gray-700 dark:text-gray-300">{h.total_recipients}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {h.created_at ? new Date(h.created_at).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default BroadcastEmail;
