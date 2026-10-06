import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { RefreshCw, Save, Star, Play, BarChart2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

const LEVEL_LABELS = { 4: 'Siêu trúng tủ', 3: 'Cao', 2: 'Trung bình', 1: 'Thấp' };

function Stars({ level }) {
  if (!level) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1" title={LEVEL_LABELS[level]}>
      {Array.from({ length: level }).map((_, i) => (
        <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
      ))}
      <span className="ml-1 text-xs text-gray-500">{LEVEL_LABELS[level]}</span>
    </span>
  );
}

const ForecastAuto = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [decayDays, setDecayDays] = useState(21);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [edits, setEdits] = useState({}); // key -> occurrence value being edited

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };
  const keyOf = (p) => `${p.kind}:${p.id}`;

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/admin/forecast-auto/parts`;
      if (onlyActive) url += '?only_active=true';
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error('Không tải được danh sách');
      const data = await res.json();
      setParts(data.parts || []);
      setDecayDays(data.decay_days ?? 21);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const saveOccurrence = async (p) => {
    const k = keyOf(p);
    const val = edits[k];
    const next = val === undefined ? p.occurrence_count : parseInt(val, 10);
    if (Number.isNaN(next) || next < 0) { toast.error('Giá trị không hợp lệ'); return; }
    try {
      const res = await fetch(`${API_BASE}/admin/forecast-auto/part`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ kind: p.kind, id: p.id, occurrence_count: next }),
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      toast.success('Đã lưu');
      setEdits((e) => { const n = { ...e }; delete n[k]; return n; });
      fetchParts();
    } catch (e) { toast.error(e.message); }
  };

  const saveDecay = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/forecast-auto/settings`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ decay_days: parseInt(decayDays, 10) || 21 }),
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      toast.success('Đã lưu ngưỡng decay');
    } catch (e) { toast.error(e.message); }
  };

  const runDecay = async () => {
    if (!window.confirm('Chạy decay ngay bây giờ?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/forecast-auto/run-decay`, { method: 'POST', headers: authHeaders });
      if (!res.ok) throw new Error('Thất bại');
      const d = await res.json();
      toast.success(`Decay: giảm ${d.decayed}, bảo vệ ${d.protected}`);
      fetchParts();
    } catch (e) { toast.error(e.message); }
  };

  // Global (Koyeb) has no cron: the difficulty job is triggered from here.
  const runDifficulty = async () => {
    if (!window.confirm('Tính lại độ khó (difficulty) cho tất cả part/task ngay bây giờ?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/difficulty/recompute`, { method: 'POST', headers: authHeaders });
      if (!res.ok) throw new Error('Thất bại');
      const d = await res.json();
      toast.success(`Độ khó: Reading ${d.reading_classified}, Listening ${d.listening_classified}, Writing ${d.writing_classified}, Speaking ${d.speaking_classified} đã phân loại`);
    } catch (e) { toast.error(e.message); }
  };

  const filtered = q
    ? parts.filter((p) => (p.test || '').toLowerCase().includes(q.toLowerCase()) || (p.title || '').toLowerCase().includes(q.toLowerCase()))
    : parts;

  const fmtDate = (iso) => { try { return iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'; } catch { return '—'; } };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <ToastContainer position="top-right" autoClose={2000} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Forecast tự động (Occurrence)</h1>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <button onClick={fetchParts} className="btn bg-[#0096b1] text-white hover:bg-[#007a90] flex items-center gap-2"><RefreshCw size={16} /> Làm mới</button>
                <button onClick={runDecay} className="btn bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"><Play size={16} /> Chạy decay</button>
                <button onClick={runDifficulty} className="btn bg-[#eb7e37] text-white hover:bg-[#d06c2c] flex items-center gap-2"><BarChart2 size={16} /> Tính lại độ khó</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo test / title..." className="rounded-lg border border-gray-300 px-3 py-2 w-64 dark:bg-gray-800 dark:border-gray-700" />
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Chỉ hiện đang trong forecast (≥1)
              </label>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Ngưỡng decay (ngày):</span>
                <input type="number" value={decayDays} onChange={(e) => setDecayDays(e.target.value)} className="w-20 rounded-lg border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:border-gray-700" />
                <button onClick={saveDecay} className="px-3 py-1 rounded-lg bg-[#0096b1] text-white text-sm">Lưu</button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Đang tải...</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-3">Test</th>
                      <th className="px-4 py-3">Part</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 text-center">Occurrence</th>
                      <th className="px-4 py-3">Forecast Level</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
                    {filtered.map((p) => {
                      const k = keyOf(p);
                      return (
                        <tr key={k} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100">{p.test}</td>
                          <td className="px-4 py-2.5 text-gray-500"><span className="capitalize">{p.skill}</span> · Part {p.part}</td>
                          <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{p.title || <em className="text-gray-300">(trống)</em>}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input type="number" min="0"
                              value={edits[k] !== undefined ? edits[k] : p.occurrence_count}
                              onChange={(e) => setEdits((s) => ({ ...s, [k]: e.target.value }))}
                              className="w-16 text-center rounded border border-gray-300 py-1 dark:bg-gray-700 dark:border-gray-600" />
                          </td>
                          <td className="px-4 py-2.5"><Stars level={p.forecast_level} /></td>
                          <td className="px-4 py-2.5 text-gray-400">{fmtDate(p.last_updated)}</td>
                          <td className="px-4 py-2.5">
                            {edits[k] !== undefined && String(edits[k]) !== String(p.occurrence_count) && (
                              <button onClick={() => saveOccurrence(p)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0096b1] text-white text-xs"><Save size={13} /> Lưu</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForecastAuto;
