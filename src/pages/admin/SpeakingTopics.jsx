import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import {
  RefreshCw, Star, Trash2, Save, X, ChevronUp, ChevronDown, ChevronRight,
  Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, Volume2, Pencil, Plus,
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

const LEVEL_LABELS = { 4: 'Siêu trúng tủ', 3: 'Cao', 2: 'Trung bình', 1: 'Thấp' };
const CATEGORIES = ['place', 'people', 'education', 'recreation', 'object', 'others'];
const WORK_STUDY = [
  { key: 'neutral', label: 'Trung tính' },
  { key: 'work', label: 'Work' },
  { key: 'study', label: 'Study' },
];
const BANDS = ['4.5-5.5', '6.0-6.5', '7.0-7.5', '8.0-9.0'];
// Giọng examiner đã chốt — xem app/utils/speaking_tts.py
// Danh sách giọng lấy từ máy chủ, KHÔNG hardcode: đổi engine TTS (Gemini -> Google) là
// tên giọng đổi hết, hardcode thì ô chọn giọng trỏ vào giọng đã chết và nút nghe thử 404.
const GROUP_LABEL = {
  part1: 'Câu hỏi Part 1',
  part2: 'Phần nói dài (cue card)',
  part2_followup: 'Follow-up questions',
  part3: 'Câu hỏi Part 3',
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const box = 'rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 text-sm';
const wordCount = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

function Stars({ level }) {
  if (!level) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1" title={LEVEL_LABELS[level]}>
      {Array.from({ length: level }).map((_, i) => (
        <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
      ))}
    </span>
  );
}

const GEN_STYLE = {
  done:    { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700', label: 'đã sinh' },
  running: { Icon: Loader2,      cls: 'bg-blue-100 text-blue-700',       label: 'đang chạy', spin: true },
  pending: { Icon: Clock,        cls: 'bg-gray-100 text-gray-500',       label: 'chờ' },
  failed:  { Icon: AlertCircle,  cls: 'bg-red-100 text-red-700',         label: 'lỗi' },
};

function GenBadge({ status, title }) {
  const s = GEN_STYLE[status] || GEN_STYLE.pending;
  return (
    <span title={title} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} className={s.spin ? 'animate-spin' : ''} /> {s.label}
    </span>
  );
}

// "7/10 đã sinh" for the table, plus a red count when something failed.
function GenProgress({ gen, total }) {
  const done = gen?.done || 0;
  const failed = gen?.failed || 0;
  if (!total) return <span className="text-gray-300">—</span>;
  const running = (gen?.running || 0) + (gen?.pending || 0);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
      <span className={done === total ? 'text-emerald-700 font-semibold' : 'text-gray-600 dark:text-gray-300'}>
        {done}/{total}
      </span>
      {running > 0 && <Loader2 size={12} className="animate-spin text-blue-600" />}
      {failed > 0 && <span className="text-red-600 font-semibold">{failed} lỗi</span>}
    </span>
  );
}

// Outlines are stored as JSON and their shape differs per part, so render the shapes we
// know and fall back to raw JSON rather than showing nothing if the model returns
// something unexpected.
function Outline({ part, data }) {
  if (!data) return <p className="text-sm text-gray-400">Chưa có dàn bài.</p>;
  const Line = ({ label, children }) => (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 font-semibold text-[#2b5356] dark:text-gray-300">{label}:</span>
      <span className="text-gray-700 dark:text-gray-300">{children}</span>
    </div>
  );

  if (part === 'part2' && Array.isArray(data.cue_cards)) {
    return (
      <div className="space-y-3">
        {data.cue_cards.map((c, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-bold text-[#0096b1] mb-1.5">Đoạn {i + 1} — {c.cue}</div>
            <Line label="Ý chính">{c.main_point}</Line>
            {(c.development || []).map((d, k) => <Line key={k} label={`Triển khai ${k + 1}`}>{d}</Line>)}
            {c.specific_detail && <Line label="Chi tiết cụ thể">{c.specific_detail}</Line>}
            {c.feeling && <Line label="Cảm xúc">{c.feeling}</Line>}
            {c.result && <Line label="Kết quả">{c.result}</Line>}
            {c.reflection && <Line label="Suy ngẫm">{c.reflection}</Line>}
          </div>
        ))}
      </div>
    );
  }

  if (data.idea_1 || data.idea_2) {
    return (
      <div className="space-y-2">
        {data.question_type && <Line label="Dạng câu hỏi">{data.question_type}</Line>}
        {data.direct_answer && <Line label="Trả lời thẳng">{data.direct_answer}</Line>}
        {['idea_1', 'idea_2'].map((k, i) => data[k] && (
          <div key={k} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
            <Line label={`Ý ${i + 1}`}>{data[k].idea}</Line>
            <Line label="Ví dụ">{data[k].example}</Line>
            <Line label="Kết quả">{data[k].result}</Line>
          </div>
        ))}
      </div>
    );
  }

  if (data.direct_answer || data.explanation) {
    return (
      <div className="space-y-1.5">
        {data.question_type && <Line label="Dạng câu hỏi">{data.question_type}</Line>}
        {data.direct_answer && <Line label="Trả lời thẳng">{data.direct_answer}</Line>}
        {(data.explanation || []).map((e, i) => <Line key={i} label={`Ý ${i + 1}`}>{e}</Line>)}
      </div>
    );
  }

  return (
    <pre className="text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// Thêm một câu hỏi vào topic đã có. Câu mới tự vào hàng chờ sinh gợi ý + giọng đọc.
function AddQuestion({ topicId, part, authHeaders, onAdded }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const text = content.trim();
    if (!text) { toast.error('Nội dung câu hỏi không được để trống'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics/${topicId}/questions`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, part }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.detail || 'Không thêm được câu hỏi');
      toast.success('Đã thêm câu hỏi — đang sinh gợi ý và giọng đọc');
      setContent('');
      setOpen(false);
      if (onAdded) onAdded();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
              className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-500 hover:text-[#0096b1] hover:border-[#0096b1] inline-flex items-center justify-center gap-1.5">
        <Plus size={15} /> Thêm câu hỏi
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} autoFocus
                placeholder="Nhập nội dung câu hỏi..." className="form-textarea w-full text-sm" />
      <div className="flex gap-2 mt-2">
        <button onClick={save} disabled={saving}
                className="btn-sm bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-50">
          {saving ? 'Đang thêm...' : 'Thêm'}
        </button>
        <button onClick={() => { setContent(''); setOpen(false); }}
                className="btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}


// One question: status, the generated material, and the button to run it again.
function QuestionPanel({ q, index, onRegen, onEdited, authHeaders, voice }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [band, setBand] = useState(BANDS[1]);
  const [loading, setLoading] = useState(false);
  // Sửa nội dung câu hỏi ngay tại đây. Đổi chữ thì gợi ý/từ vựng cũ không còn đúng nữa
  // nên backend tự đưa câu về hàng chờ sinh lại, và clip giọng đọc cũng tự hết hiệu lực.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(q.content);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef(null);

  const saveEdit = async () => {
    const content = (draft || '').trim();
    if (!content) { toast.error('Nội dung câu hỏi không được để trống'); return; }
    if (content === q.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/questions/${q.question_id}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.detail || 'Không lưu được câu hỏi');
      toast.success('Đã lưu câu hỏi — đang sinh lại gợi ý và giọng đọc');
      setEditing(false);
      setData(null);
      if (onEdited) onEdited();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // The <audio> element can't send an Authorization header, so the token goes in the
  // query string — the endpoint accepts either.
  const clipSrc = `${API_BASE}/admin/speaking/tts/audio?key=question:${q.question_id}`
    + `&voice=${encodeURIComponent(voice)}`
    + `&token=${encodeURIComponent(localStorage.getItem('access_token') || '')}`;

  const play = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    const p = el.play();
    if (p && p.catch) p.catch(() => toast.error('Không phát được — câu này chưa có giọng đọc'));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/questions/${q.question_id}/generated`,
        { headers: authHeaders });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.detail || 'Không tải được nội dung');
      setData(d);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [q.question_id]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !data) load();
  };

  const vocab = data?.vocabulary || {};
  const sample = data?.samples?.[band] || '';
  const hasVoice = (q.voiced_in || []).includes(voice);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2 px-3 py-2">
        <button onClick={toggle} className="mt-0.5 text-gray-400 hover:text-[#0096b1] shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="w-6 shrink-0 text-right text-gray-400 text-sm">{index}</span>
        {editing ? (
          <div className="flex-1 min-w-0">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
                      className="form-textarea w-full text-sm" autoFocus />
            <div className="flex gap-2 mt-2">
              <button onClick={saveEdit} disabled={saving}
                      className="btn-sm bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
              </button>
              <button onClick={() => { setDraft(q.content); setEditing(false); }}
                      className="btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <button onClick={toggle} className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {q.content}
          </button>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {!editing && (
            <button onClick={() => { setDraft(q.content); setEditing(true); }} title="Sửa câu hỏi"
                    className="text-gray-400 hover:text-[#0096b1] p-1">
              <Pencil size={15} />
            </button>
          )}
          <GenBadge status={q.gen_status} title={q.gen_error || ''} />
          <button onClick={play} disabled={!hasVoice}
                  title={hasVoice ? `Nghe thử giọng đang chọn`
                    : 'Chưa có clip cho giọng đang chọn — bấm "Giọng đọc" ở trên để sinh'}
                  className="text-[#0096b1] hover:text-[#007a90] disabled:text-gray-300 p-1">
            <Volume2 size={15} />
          </button>
          <audio ref={audioRef} src={clipSrc} preload="none" className="hidden" />
          <button onClick={() => onRegen(q)} title="Sinh lại câu này"
                  className="text-[#0096b1] hover:text-[#007a90] p-1">
            <Sparkles size={15} />
          </button>
        </div>
      </div>

      {q.gen_status === 'failed' && q.gen_error && (
        <p className="px-3 pb-2 text-xs text-red-600">{q.gen_error}</p>
      )}

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-4 bg-gray-50/60 dark:bg-gray-900/20">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : !data ? null : (
            <>
              <div>
                <h4 className="text-sm font-bold text-[#2b5356] dark:text-gray-100 mb-2">Dàn bài</h4>
                <Outline part={data.part} data={data.outline} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h4 className="text-sm font-bold text-[#2b5356] dark:text-gray-100">Bài mẫu theo band</h4>
                  <div className="flex gap-1">
                    {BANDS.map((b) => (
                      <button key={b} onClick={() => setBand(b)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                band === b ? 'bg-[#0096b1] text-white'
                                           : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                              }`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                {sample ? (
                  <>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      {sample}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{wordCount(sample)} từ</p>
                  </>
                ) : <p className="text-sm text-gray-400">Chưa có bài mẫu.</p>}
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#2b5356] dark:text-gray-100 mb-2">
                  Từ vựng ({Object.values(vocab).reduce((n, v) => n + v.length, 0)})
                </h4>
                {BANDS.filter((b) => (vocab[b] || []).length).map((b) => (
                  <div key={b} className="mb-3">
                    <div className="text-xs font-bold text-[#eb7e37] mb-1">{b}</div>
                    <table className="w-full text-sm">
                      <tbody>
                        {vocab[b].map((v, i) => (
                          <tr key={i} className="align-top border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <td className="py-1 pr-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{v.term}</td>
                            <td className="py-1 pr-3 text-gray-600 dark:text-gray-400">{v.meaning_vi}</td>
                            <td className="py-1 text-gray-500 italic">{v.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {!Object.keys(vocab).length && <p className="text-sm text-gray-400">Chưa có từ vựng.</p>}
              </div>

              {data.model && <p className="text-xs text-gray-400">Sinh bởi {data.model}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const COLUMNS = [
  { key: 'part', label: 'Part', sort: (t) => t.part },
  { key: 'title', label: 'Title', sort: (t) => (t.title || '').toLowerCase() },
  { key: 'category', label: 'Nhóm chủ đề', sort: (t) => t.category || '' },
  { key: 'is_important', label: 'Quan trọng', sort: (t) => (t.is_important ? 1 : 0) },
  { key: 'occurrence_count', label: 'Occurrence', sort: (t) => t.occurrence_count || 0 },
  { key: 'forecast_level', label: 'Forecast', sort: (t) => t.forecast_level || 0 },
  { key: 'gen', label: 'Nội dung AI', sort: (t) => (t.gen?.done || 0) - (t.question_count || 0) },
  { key: 'last_updated', label: 'Last update', sort: (t) => t.last_updated || '' },
  { key: 'appear_window', label: 'Thời gian xuất hiện', sort: (t) => {
      const m = /(\d{1,2})\s*\/\s*(\d{4})/.exec(t.appear_window || '');
      return m ? Number(m[2]) * 100 + Number(m[1]) : 0;
    } },
];

const SpeakingTopics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [sort, setSort] = useState({ key: 'last_updated', dir: 'desc' });
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({});
  const [savingDetail, setSavingDetail] = useState(false);
  const [voices, setVoices] = useState([]);
  const [audioBusy, setAudioBusy] = useState(false);
  const [voice, setVoice] = useState('');
  const detailIdRef = useRef(null);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };

  const fetchTopics = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      // API_BASE may be '' (same-origin) in global, so give URL() a base.
      const url = new URL(`${API_BASE}/admin/speaking/topics`, window.location.origin);
      if (partFilter) url.searchParams.set('part', partFilter);
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Không tải được danh sách');
      setTopics(data.topics || []);
    } catch (e) { if (!quiet) toast.error(e.message); }
    finally { if (!quiet) setLoading(false); }
  }, [partFilter]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // Giọng lấy từ máy chủ để luôn khớp engine TTS đang chạy.
  useEffect(() => {
    fetch(`${API_BASE}/admin/speaking/tts/status`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => {
        const list = d.voice_catalog || (d.voices || []).map((n) => ({ name: n }));
        setVoices(list);
        setVoice((cur) => (list.some((v) => v.name === cur)
          ? cur : (d.default_voice || (list[0] && list[0].name) || '')));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generation runs in the background, so poll while anything is still working rather
  // than making staff hit refresh to find out whether a topic finished.
  const busy = useMemo(
    () => topics.some((t) => (t.gen?.pending || 0) + (t.gen?.running || 0) > 0),
    [topics]);

  useEffect(() => {
    if (!busy) return undefined;
    const id = setInterval(() => {
      fetchTopics(true);
      if (detailIdRef.current) openDetail(detailIdRef.current, true);
    }, 5000);
    return () => clearInterval(id);
  }, [busy, fetchTopics]);

  const openDetail = async (topicId, quiet = false) => {
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics/${topicId}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Không mở được topic');
      detailIdRef.current = topicId;
      setDetail(data);
      if (!quiet) {
        setForm({
          title: data.title || '',
          category: data.category || '',
          work_study: data.work_study || 'neutral',
          is_important: !!data.is_important,
          occurrence_count: data.occurrence_count ?? 0,
          appear_window: data.appear_window || '',
        });
      }
      return data;                       // để chỗ theo dõi tiến độ giọng đọc đọc được số clip
    } catch (e) {
      if (!quiet) toast.error(e.message);
      return null;
    }
  };

  const closeDetail = () => { detailIdRef.current = null; setDetail(null); };

  const saveDetail = async () => {
    setSavingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics/${detail.topic_id}`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ ...form, occurrence_count: Number(form.occurrence_count) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Lưu thất bại');
      toast.success('Đã lưu');
      closeDetail();
      fetchTopics();
    } catch (e) { toast.error(e.message); }
    finally { setSavingDetail(false); }
  };

  const removeTopic = async (t) => {
    if (!window.confirm(`Xoá topic "${t.title}"? Câu hỏi, gợi ý và từ vựng của nó cũng bị xoá theo.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics/${t.topic_id}`, {
        method: 'DELETE', headers: authHeaders,
      });
      if (!res.ok) throw new Error('Xoá thất bại');
      toast.success('Đã xoá');
      closeDetail();
      fetchTopics();
    } catch (e) { toast.error(e.message); }
  };

  const regenTopic = async (topicId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics/${topicId}/generate`,
        { method: 'POST', headers: authHeaders });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.detail || 'Không chạy được');
      toast.success(d.queued ? `Đang sinh lại ${d.queued} câu` : 'Mọi câu đã có nội dung');
      fetchTopics(true);
      if (detailIdRef.current) openDetail(detailIdRef.current, true);
    } catch (e) { toast.error(e.message); }
  };

  const regenAudio = async (topicId) => {
    setAudioBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/speaking/tts/generate?topic_id=${topicId}`,
        { method: 'POST', headers: authHeaders });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.detail || 'Không chạy được');
      if (!d.missing) {
        toast.success('Mọi câu đã có đủ giọng đọc');
        setAudioBusy(false);
        return;
      }
      toast.success(`Đang sinh ${d.missing} clip giọng đọc...`);
      // Sinh ở nền: tự hỏi lại vài lần để admin thấy số clip tăng dần, khỏi phải bấm
      // refresh thủ công.
      let left = 12;
      const poll = setInterval(async () => {
        left -= 1;
        const fresh = await openDetail(topicId, true);
        const done = fresh && fresh.audio && fresh.audio.made >= fresh.audio.total;
        if (done || left <= 0) {
          clearInterval(poll);
          setAudioBusy(false);
          if (done) toast.success('Đã sinh xong giọng đọc');
        }
      }, 5000);
    } catch (e) {
      toast.error(e.message);
      setAudioBusy(false);
    }
  };

  const regenQuestion = async (question) => {
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/questions/${question.question_id}/generate`,
        { method: 'POST', headers: authHeaders });
      if (!res.ok) throw new Error('Không chạy được');
      toast.success('Đang sinh lại câu này');
      if (detailIdRef.current) openDetail(detailIdRef.current, true);
      fetchTopics(true);
    } catch (e) { toast.error(e.message); }
  };

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = (t) => !needle || [
      t.part === 'part1' ? 'part 1' : 'part 2',
      t.title, t.category, t.work_study,
      t.is_important ? 'quan trọng' : '',
      String(t.occurrence_count ?? ''),
      LEVEL_LABELS[t.forecast_level] || '',
      t.appear_window,
    ].some((v) => (v || '').toString().toLowerCase().includes(needle));

    const col = COLUMNS.find((c) => c.key === sort.key) || COLUMNS[7];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return topics.filter(hit).sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      if (x < y) return -dir;
      if (x > y) return dir;
      return 0;
    });
  }, [topics, q, sort]);

  const fmtDate = (iso) => { try { return iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'; } catch { return '—'; } };

  const grouped = detail
    ? (detail.questions || []).reduce((acc, qq) => {
        (acc[qq.part] = acc[qq.part] || []).push(qq);
        return acc;
      }, {})
    : {};

  // Global (Koyeb) has no cron, so the Speaking upkeep jobs are triggered by hand here.
  const [jobBusy, setJobBusy] = useState('');
  const runJob = async (name, path, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setJobBusy(name);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking${path}`, { method: 'POST', headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Chạy job thất bại');
      toast.success(`${name}: ${JSON.stringify(data)}`, { autoClose: 6000 });
      fetchTopics(true);
    } catch (e) { toast.error(e.message); }
    finally { setJobBusy(''); }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <ToastContainer position="top-right" autoClose={2500} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Quản lý topic Speaking</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Part 3 không có dòng riêng — nó thuộc gói của topic Part 2 tương ứng.
                  {busy && <span className="ml-2 text-blue-600 font-medium">Đang sinh nội dung, bảng tự cập nhật...</span>}
                </p>
              </div>
              <button onClick={() => fetchTopics()}
                      className="btn bg-[#0096b1] text-white hover:bg-[#007a90] flex items-center gap-2 mt-4 sm:mt-0">
                <RefreshCw size={16} /> Làm mới
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <span className="text-gray-500 mr-1">Jobs:</span>
              {[
                ['Decay Forecast', '/forecast/decay', null],
                ['Sinh nội dung còn chờ', '/jobs/generate-pending?retry_failed=true', null],
                ['Dọn ghi âm cũ (chạy thử)', '/jobs/prune-audio?commit=false', null],
                ['Dọn ghi âm cũ (xoá thật)', '/jobs/prune-audio?commit=true',
                  'Xoá thật các bản ghi âm cũ trên R2? Transcript và điểm vẫn được giữ.'],
              ].map(([name, path, confirmText]) => (
                <button key={path} disabled={!!jobBusy}
                        onClick={() => runJob(name, path, confirmText)}
                        className="btn-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-[#0096b1] disabled:opacity-50 flex items-center gap-1">
                  {jobBusy === name && <Loader2 size={13} className="animate-spin" />} {name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <input value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="Tìm theo tên, nhóm, thời gian..." className={`${box} w-72`} />
              <select value={partFilter} onChange={(e) => setPartFilter(e.target.value)} className={box}>
                <option value="">Tất cả part</option>
                <option value="part1">Part 1</option>
                <option value="part2">Part 2</option>
              </select>
              <span className="text-sm text-gray-500 ml-auto">{rows.length} topic</span>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Đang tải...</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Chưa có topic nào.</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      {COLUMNS.map((c) => (
                        <th key={c.key} className="px-4 py-3 whitespace-nowrap select-none cursor-pointer hover:text-[#0096b1]"
                            onClick={() => toggleSort(c.key)}>
                          <span className="inline-flex items-center gap-1">
                            {c.label}
                            {sort.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.map((t) => (
                      <tr key={t.topic_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${t.is_active === false ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-600 dark:text-gray-300">
                          {t.part === 'part1' ? 'Part 1' : 'Part 2'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openDetail(t.topic_id)}
                                  className="text-left font-semibold text-[#0096b1] hover:text-[#007a90] hover:underline">
                            {t.title}
                          </button>
                          <div className="text-xs text-gray-400">{t.question_count} câu</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {t.category ? cap(t.category) : '—'}
                        </td>
                        <td className="px-4 py-3">{t.is_important
                          ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#eb7e37]/15 text-[#eb7e37]">Quan trọng</span>
                          : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">{t.occurrence_count ?? 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><Stars level={t.forecast_level} /></td>
                        <td className="px-4 py-3"><GenProgress gen={t.gen} total={t.question_count} /></td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(t.last_updated)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{t.appear_window || '—'}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={() => regenTopic(t.topic_id)} title="Sinh lại nội dung còn thiếu"
                                  className="text-gray-300 hover:text-[#0096b1] p-1">
                            <Sparkles size={16} />
                          </button>
                          <button onClick={() => removeTopic(t)} title="Xoá topic"
                                  className="text-gray-300 hover:text-red-600 p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#2b5356] dark:text-gray-100 truncate">
                {detail.part === 'part1' ? 'Part 1' : 'Part 2 + 3'} — {detail.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <Volume2 size={15} className="text-[#0096b1]" />
                  <select value={voice} onChange={(e) => setVoice(e.target.value)}
                          className="rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1 text-sm">
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.accent_label && v.gender_label
                          ? `${v.accent_label} · ${v.gender_label}` : v.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button onClick={() => regenTopic(detail.topic_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#0096b1]/10 text-[#0096b1] hover:bg-[#0096b1]/20">
                  <Sparkles size={15} /> Sinh lại gợi ý
                </button>
                {/* Giọng đọc sinh ở nền và có thể rớt giữa chừng (mạng ra quốc tế hay
                    rớt gói). Nút này để admin tự bấm lại thay vì chờ cron ban đêm. */}
                <button onClick={() => regenAudio(detail.topic_id)} disabled={audioBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#eb7e37]/10 text-[#eb7e37] hover:bg-[#eb7e37]/20 disabled:opacity-50">
                  <Volume2 size={15} />
                  {detail.audio
                    ? `Giọng đọc ${detail.audio.made}/${detail.audio.total}`
                    : 'Sinh giọng đọc'}
                </button>
                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <span className="block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5">Tên topic</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                       className={`${box} w-full font-semibold`} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5">Occurrence times</span>
                  <input type="number" min={0} value={form.occurrence_count}
                         onChange={(e) => setForm({ ...form, occurrence_count: e.target.value })} className={`${box} w-full`} />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5">Thời gian xuất hiện</span>
                  <input value={form.appear_window} placeholder="05/2026 - 08/2026"
                         onChange={(e) => setForm({ ...form, appear_window: e.target.value })} className={`${box} w-full`} />
                </div>
              </div>

              {detail.part === 'part1' ? (
                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.is_important}
                           onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />
                    Topic quan trọng
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Phân loại:</span>
                    {WORK_STUDY.map((w) => (
                      <label key={w.key} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="ws-edit" checked={form.work_study === w.key}
                               onChange={() => setForm({ ...form, work_study: w.key })} />
                        {w.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5">Nhóm chủ đề</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button"
                              onClick={() => setForm({ ...form, category: form.category === c ? '' : c })}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                form.category === c
                                  ? 'bg-[#0096b1] text-white border-[#0096b1]'
                                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-[#0096b1]'
                              }`}>
                        {cap(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(grouped).map(([part, items]) => (
                <div key={part}>
                  <span className="block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-2">
                    {GROUP_LABEL[part] || part} ({items.length})
                  </span>
                  <div className="space-y-2">
                    {items.map((qq, i) => (
                      <QuestionPanel key={qq.question_id} q={qq} index={i + 1}
                                     onRegen={regenQuestion} authHeaders={authHeaders}
                                     onEdited={() => openDetail(detail.topic_id, true)}
                                     voice={voice} />
                    ))}
                    {/* Phần nói dài chỉ có đúng một đề bài (cue card), không thêm câu được. */}
                    {part !== 'part2' && (
                      <AddQuestion topicId={detail.topic_id} part={part}
                                   authHeaders={authHeaders}
                                   onAdded={() => openDetail(detail.topic_id, true)} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
              <button onClick={() => removeTopic({ topic_id: detail.topic_id, title: detail.title })}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1.5">
                <Trash2 size={15} /> Xoá topic
              </button>
              <div className="flex items-center gap-2">
                <button onClick={closeDetail}
                        className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">Đóng</button>
                <button onClick={saveDetail} disabled={savingDetail}
                        className="btn bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-50 flex items-center gap-2">
                  <Save size={16} /> {savingDetail ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingTopics;
