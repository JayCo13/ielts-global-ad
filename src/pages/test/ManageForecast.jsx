import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Home, ChevronRight, Filter, FileText, Headphones, BookOpen, Edit3, RotateCcw, Star, Search, Tag } from 'lucide-react';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';

const QUESTION_TYPES = {
  listening: [
    'Multiple Choice', 'Matching', 'Plan/Map/Diagram Labelling',
    'Form Completion', 'Note Completion', 'Table Completion',
    'Flow-chart Completion', 'Summary Completion', 'Sentence Completion',
    'Short Answer'
  ],
  reading: [
    'Multiple Choice', 'Identifying Information (T/F/NG)',
    "Identifying Writer's Views (Y/N/NG)", 'Matching Information',
    'Matching Headings', 'Matching Features', 'Matching Sentence Endings',
    'Sentence Completion', 'Summary Completion', 'Note Completion',
    'Table Completion', 'Flow-chart Completion', 'Diagram Label Completion',
    'Short Answer'
  ]
};

const skillLabel = (types) => {
  if (!types || types.length === 0) return 'Unknown';
  if (types.includes('essay')) return 'writing';
  if (types.includes('listening')) return 'listening';
  if (types.includes('reading')) return 'reading';
  return types[0];
};

const SkillBadge = ({ skill }) => {
  const colors = {
    writing: 'bg-green-100 text-green-700',
    listening: 'bg-purple-100 text-purple-700',
    reading: 'bg-blue-100 text-blue-700'
  };
  const icons = {
    writing: FileText,
    listening: Headphones,
    reading: BookOpen
  };
  const Icon = icons[skill] || FileText;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colors[skill] || 'bg-gray-100 text-gray-700'}`}>
      <Icon className="w-3.5 h-3.5" />
      {skill}
    </span>
  );
};

const SimpleModal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b flex-none">
            <div className="text-lg font-medium text-gray-900">{title}</div>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
          <div className="px-6 pb-6 flex justify-end flex-none">
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ManageForecast = () => {
  const [tests, setTests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterSkill, setFilterSkill] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [parts, setParts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [forecastMeta, setForecastMeta] = useState({ sections: {}, writing: {} });
  const [page, setPage] = useState(1);
  const pageSize = 7;
  const [currentSkill, setCurrentSkill] = useState(null);
  const [filterForecast, setFilterForecast] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = React.useRef(null);

  const resetFilters = () => {
    setFilterSkill('all');
    setFilterForecast('all');
    setSearchQuery('');
    setPage(1);
  };

  // Server-side paginated fetch — only loads 1 page at a time
  const fetchPage = React.useCallback(async (currentPage, search, skill, forecast) => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({ skip, limit: pageSize });
      if (search) params.set('search', search);
      if (skill && skill !== 'all') {
        params.set('exam_type', skill === 'writing' ? 'essay' : skill);
      }
      if (forecast === 'is_forecast') params.set('forecast_only', 'true');
      const res = await fetchWithTimeout(`${API_BASE}/admin/dashboard/exams?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await res.json();
      // Handle both old array and new {items, total_count} format
      if (Array.isArray(data)) {
        setTests(data);
        setTotalCount(data.length);
      } else {
        setTests(data.items || []);
        setTotalCount(data.total_count || 0);
      }
    } catch (e) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch forecast meta once (lightweight)
  useEffect(() => {
    const fetchForecastMeta = async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/admin/dashboard/forecast-meta`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const data = await res.json();
        setForecastMeta({
          sections: data.sections || {},
          writing: data.writing || {}
        });
      } catch (e) {
        setForecastMeta({ sections: {}, writing: {} });
      }
    };
    fetchForecastMeta();
  }, []);

  // Fetch when page/filters change
  useEffect(() => {
    fetchPage(page, searchQuery, filterSkill, filterForecast);
  }, [page, filterSkill, filterForecast, fetchPage]);

  // Debounced search — waits 500ms after user stops typing
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, searchQuery, filterSkill, filterForecast);
    }, 500);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const pageItems = tests; // Already paginated from server
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getVisiblePages = (total, current) => {
    const pages = [];
    const max = 9;
    if (total <= max) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    let start = Math.max(2, current - 2);
    let end = Math.min(total - 1, current + 2);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  };
  const visiblePages = getVisiblePages(totalPages, page);

  const openTestDialog = async (test) => {
    setSelectedTest(test);
    const skill = skillLabel(test.section_types);
    setCurrentSkill(skill);
    if (skill === 'listening') {
      // Try cached forecastMeta first, fall back to API call
      const cached = forecastMeta.sections[test.exam_id];
      if (cached && cached.length > 0) {
        setParts(cached.map(s => ({
          part_number: s.part_number,
          is_forecast: !!s.is_forecast,
          forecast_title: s.forecast_title || '',
          is_recommended: !!s.is_recommended,
          question_types: Array.isArray(s.question_types) ? s.question_types : []
        })));
      } else {
        try {
          const res = await fetchWithTimeout(`${API_BASE}/admin/listening-test/${test.exam_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          });
          const data = await res.json();
          setParts((data.parts || []).map(s => ({
            part_number: s.part_number,
            is_forecast: !!s.is_forecast,
            forecast_title: s.forecast_title || '',
            is_recommended: !!s.is_recommended,
            question_types: Array.isArray(s.question_types) ? s.question_types : []
          })));
        } catch (e) {
          toast.error('Failed to load listening parts');
          setParts([]);
        }
      }
      setIsDialogOpen(true);
      return;
    }
    if (skill === 'reading') {
      const cached = forecastMeta.sections[test.exam_id];
      if (cached && cached.length > 0) {
        setParts(cached.map(s => ({
          part_number: s.part_number,
          is_forecast: !!s.is_forecast,
          forecast_title: s.forecast_title || '',
          is_recommended: !!s.is_recommended,
          question_types: Array.isArray(s.question_types) ? s.question_types : []
        })));
      } else {
        try {
          const res = await fetchWithTimeout(`${API_BASE}/admin/reading/reading-test/${test.exam_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          });
          const data = await res.json();
          setParts((data.sections || []).map(s => ({
            part_number: s.order_number,
            is_forecast: !!s.is_forecast,
            forecast_title: s.forecast_title || '',
            is_recommended: !!s.is_recommended,
            question_types: Array.isArray(s.question_types) ? s.question_types : []
          })));
        } catch (e) {
          toast.error('Failed to load reading parts');
          setParts([]);
        }
      }
      setIsDialogOpen(true);
      return;
    }
    if (skill !== 'writing') {
      setParts([]);
      setIsDialogOpen(true);
      return;
    }
    // Writing
    const cachedWriting = forecastMeta.writing[test.exam_id];
    if (cachedWriting && cachedWriting.length > 0) {
      setParts(cachedWriting.map(p => ({
        ...p,
        title: p.title || '',
        is_forecast: !!p.is_forecast,
        is_recommended: !!p.is_recommended
      })));
    } else {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/admin/writing`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const data = await res.json();
        const match = (Array.isArray(data) ? data : []).find(x => x.test_id === test.exam_id);
        setParts(match ? match.parts.map(p => ({ ...p, title: p.title || '', is_forecast: !!p.is_forecast, is_recommended: !!p.is_recommended })) : []);
      } catch (e) {
        toast.error('Failed to load writing parts');
        setParts([]);
      }
    }
    setIsDialogOpen(true);
  };

  const savePart = async (p) => {
    try {
      setSaving(true);
      if (currentSkill === 'writing') {
        const res = await fetchWithTimeout(`${API_BASE}/admin/writing-task/${p.task_id}/forecast`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          // task1_type is only meaningful on Part 1, task2_type only on Part 2;
          // send empty string to clear the tag on the matching part.
          body: JSON.stringify({
            title: p.title || null,
            is_forecast: !!p.is_forecast,
            is_recommended: !!p.is_recommended,
            task1_type: p.part_number === 1 ? (p.task1_type || '') : null,
            task2_type: p.part_number === 2 ? (p.task2_type || '') : null
          })
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed');
        }
        toast.success(`Saved Part ${p.part_number}`);
      } else if (currentSkill === 'listening') {
        const res = await fetchWithTimeout(`${API_BASE}/admin/listening-test/${selectedTest.exam_id}/forecast`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            part_number: p.part_number,
            is_forecast: !!p.is_forecast,
            forecast_title: p.is_forecast ? (p.forecast_title || '') : null,
            is_recommended: !!p.is_recommended,
            question_types: p.question_types || []
          })
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed');
        }
        toast.success(`Saved Part ${p.part_number}`);
      } else if (currentSkill === 'reading') {
        const res = await fetchWithTimeout(`${API_BASE}/admin/reading/reading-test/${selectedTest.exam_id}/forecast`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            part_number: p.part_number,
            is_forecast: !!p.is_forecast,
            forecast_title: p.is_forecast ? (p.forecast_title || '') : null,
            is_recommended: !!p.is_recommended,
            question_types: p.question_types || []
          })
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed');
        }
        toast.success(`Saved Part ${p.part_number}`);
      }
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
      // Refresh the cached forecast meta so the table stays in sync
      try {
        const metaRes = await fetchWithTimeout(`${API_BASE}/admin/dashboard/forecast-meta`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const metaData = await metaRes.json();
        setForecastMeta({ sections: metaData.sections || {}, writing: metaData.writing || {} });
      } catch (_) {}
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" />
      <nav className="bg-white border-b border-gray-200 flex-none">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-2 py-4">
            <Link to="/" className="text-gray-400 hover:text-violet-600"><Home size={20} /></Link>
            <ChevronRight className="text-gray-400" size={20} />
            <span className="text-violet-600">Manage Forecasts</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Edit3 className="text-violet-600" />
                Forecast Management
              </h2>
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-full lg:w-56"
                  />
                </div>
                <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-50">
                  <Filter className="text-gray-500 w-4 h-4" />
                  <span className="text-sm text-gray-600">Skill</span>
                  <select
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-full sm:w-36"
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="listening">Listening</option>
                    <option value="reading">Reading</option>
                    <option value="writing">Writing</option>
                  </select>
                </div>
                <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-50">
                  <Filter className="text-gray-500 w-4 h-4" />
                  <span className="text-sm text-gray-600">Status</span>
                  <select
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-full sm:w-36"
                    value={filterForecast}
                    onChange={(e) => setFilterForecast(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="is_forecast">Forecast only</option>
                  </select>
                </div>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading exams...</div>
            ) : pageItems.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No exams</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forecast</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pageItems.map(t => (
                      <tr key={t.exam_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{t.title}</td>
                        <td className="px-6 py-4">
                          <SkillBadge skill={skillLabel(t.section_types)} />
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const skill = skillLabel(t.section_types);
                            if (skill === 'writing') {
                              const parts = forecastMeta.writing[t.exam_id] || [];
                              const marked = parts.filter(p => p.is_forecast).map(p => p.part_number);
                              const has = marked.length > 0;
                              return (
                                <div className="text-sm">
                                  <div className={has ? 'text-green-700' : 'text-gray-600'}>{has ? 'Yes' : 'No'}</div>
                                  <div className="text-gray-700">{has ? `Part ${marked.join(' & ')}` : '-'}</div>
                                </div>
                              );
                            }
                            // listening & reading both use sections meta
                            const parts = forecastMeta.sections[t.exam_id] || [];
                            const marked = parts.filter(p => p.is_forecast).map(p => p.part_number);
                            const has = marked.length > 0;
                            return (
                              <div className="text-sm">
                                <div className={has ? 'text-green-700' : 'text-gray-600'}>{has ? 'Yes' : 'No'}</div>
                                <div className="text-gray-700">{has ? `Part ${marked.join(' & ')}` : '-'}</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openTestDialog(t)}
                            className="px-3 py-1 bg-violet-600 text-white rounded"
                          >Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-600">Page {page} of {totalPages} ({totalCount} tests)</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >Previous</button>
                    {visiblePages.map((n, idx) => (
                      typeof n === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2">{n}</span>
                      ) : (
                        <button
                          key={n}
                          className={`px-3 py-1 border rounded ${n === page ? 'bg-violet-600 text-white border-violet-600' : ''}`}
                          onClick={() => setPage(n)}
                        >{n}</button>
                      )
                    ))}
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SimpleModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Manage Forecast – ${selectedTest?.title || ''}`}
      >
        {currentSkill === 'listening' && parts.length === 0 ? (
          <div className="mt-2 text-gray-600">No parts found for this test.</div>
        ) : currentSkill === 'listening' ? (
          <div className="space-y-4">
            {parts.map((p, idx) => (
              <div key={p.part_number} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold">Part {p.part_number}</div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={p.is_forecast} onChange={(e) => {
                        const next = [...parts];
                        next[idx] = { ...p, is_forecast: e.target.checked };
                        setParts(next);
                      }} className="w-4 h-4 rounded border-gray-300" />
                      <span>Forecast</span>
                    </label>
                    <button
                      onClick={() => {
                        const next = [...parts];
                        next[idx] = { ...p, is_recommended: !p.is_recommended };
                        setParts(next);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${p.is_recommended ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                      title={p.is_recommended ? 'Recommended' : 'Mark as recommended'}
                    >
                      <Star className="w-5 h-5" fill={p.is_recommended ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={p.forecast_title}
                  onChange={(e) => {
                    const next = [...parts];
                    next[idx] = { ...p, forecast_title: e.target.value };
                    setParts(next);
                  }}
                  placeholder="Forecast title (optional)"
                  className="mt-3 w-full px-3 py-2 border rounded"
                />
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-2 text-sm text-gray-600">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Question Types</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(QUESTION_TYPES.listening || []).map(qt => {
                      const active = (p.question_types || []).includes(qt);
                      return (
                        <button
                          key={qt}
                          type="button"
                          onClick={() => {
                            const next = [...parts];
                            const current = p.question_types || [];
                            const updated = active ? current.filter(t => t !== qt) : [...current, qt];
                            next[idx] = { ...p, question_types: updated };
                            setParts(next);
                          }}
                          className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-violet-100 border-violet-400 text-violet-700'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                          }`}
                        >
                          {qt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button disabled={saving} onClick={() => savePart(p)} className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
                </div>
              </div>
            ))}
          </div>
        ) : currentSkill === 'reading' && parts.length === 0 ? (
          <div className="mt-2 text-gray-600">No parts found for this test.</div>
        ) : currentSkill === 'reading' && parts.length === 0 ? (
          <div className="mt-2 text-gray-600">No parts found for this test.</div>
        ) : currentSkill === 'reading' ? (
          <div className="space-y-4">
            {parts.map((p, idx) => (
              <div key={p.part_number} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold">Part {p.part_number}</div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={p.is_forecast} onChange={(e) => {
                        const next = [...parts];
                        next[idx] = { ...p, is_forecast: e.target.checked };
                        setParts(next);
                      }} className="w-4 h-4 rounded border-gray-300" />
                      <span>Forecast</span>
                    </label>
                    <button
                      onClick={() => {
                        const next = [...parts];
                        next[idx] = { ...p, is_recommended: !p.is_recommended };
                        setParts(next);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${p.is_recommended ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                      title={p.is_recommended ? 'Recommended' : 'Mark as recommended'}
                    >
                      <Star className="w-5 h-5" fill={p.is_recommended ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">{p.description || 'No description'}</div>
                <input
                  type="text"
                  value={p.forecast_title}
                  onChange={(e) => {
                    const next = [...parts];
                    next[idx] = { ...p, forecast_title: e.target.value };
                    setParts(next);
                  }}
                  placeholder="Forecast title (optional)"
                  className="mt-3 w-full px-3 py-2 border rounded"
                />
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-2 text-sm text-gray-600">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Question Types</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(QUESTION_TYPES.reading || []).map(qt => {
                      const active = (p.question_types || []).includes(qt);
                      return (
                        <button
                          key={qt}
                          type="button"
                          onClick={() => {
                            const next = [...parts];
                            const current = p.question_types || [];
                            const updated = active ? current.filter(t => t !== qt) : [...current, qt];
                            next[idx] = { ...p, question_types: updated };
                            setParts(next);
                          }}
                          className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-violet-100 border-violet-400 text-violet-700'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                          }`}
                        >
                          {qt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button disabled={saving} onClick={() => savePart(p)} className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
                </div>
                <div className="mt-2 text-sm text-gray-600">Questions: {p.questions_count}</div>
              </div>
            ))}
          </div>
        ) : parts.length === 0 ? (
          <div className="mt-2 text-gray-600">No parts found for this test.</div>
        ) : (
          <div className="space-y-4">
            {parts.map((p, idx) => (
              <div key={p.task_id} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold">Part {p.part_number}</div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={p.is_forecast} onChange={(e) => {
                        const next = [...parts];
                        next[idx] = { ...p, is_forecast: e.target.checked };
                        setParts(next);
                      }} className="w-4 h-4 rounded border-gray-300" />
                      <span>Forecast</span>
                    </label>
                    <button
                      onClick={() => {
                        const next = [...parts];
                        next[idx] = { ...p, is_recommended: !p.is_recommended };
                        setParts(next);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${p.is_recommended ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                      title={p.is_recommended ? 'Recommended' : 'Mark as recommended'}
                    >
                      <Star className="w-5 h-5" fill={p.is_recommended ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={p.title}
                  onChange={(e) => {
                    const next = [...parts];
                    next[idx] = { ...p, title: e.target.value };
                    setParts(next);
                  }}
                  placeholder="Part title"
                  className="mt-3 w-full px-3 py-2 border rounded"
                />
                {p.part_number === 1 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task 1 question type
                    </label>
                    <select
                      value={p.task1_type || ''}
                      onChange={(e) => {
                        const next = [...parts];
                        next[idx] = { ...p, task1_type: e.target.value || null };
                        setParts(next);
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Untagged (sorts last)</option>
                      <option value="pie">Pie chart</option>
                      <option value="map">Map</option>
                      <option value="process">Process</option>
                      <option value="table">Table</option>
                      <option value="line">Line graph</option>
                      <option value="bar">Bar chart</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                )}
                {p.part_number === 2 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task 2 question type
                    </label>
                    <select
                      value={p.task2_type || ''}
                      onChange={(e) => {
                        const next = [...parts];
                        next[idx] = { ...p, task2_type: e.target.value || null };
                        setParts(next);
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Untagged (sorts last)</option>
                      <option value="agree_disagree">Agree or disagree</option>
                      <option value="positive_negative">Negative or positive</option>
                      <option value="advantages_disadvantages">Advantages outweigh disadvantages</option>
                      <option value="discussion">Discuss both views and give your opinion</option>
                      <option value="solutions_effects">Two parts: Solutions - effects</option>
                      <option value="two_part_mixed">Two parts: Mixed</option>
                    </select>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <button disabled={saving} onClick={() => savePart(p)} className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleModal>
    </div>
  );
};

export default ManageForecast;
