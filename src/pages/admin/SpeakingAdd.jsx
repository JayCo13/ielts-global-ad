import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { Eye, Save, Trash2, Plus, RotateCcw } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

// Part 1 and Part 2 are separate tabs rather than one long form. The API can create
// both in a single call, but "Occurrence times" and "Thời gian xuất hiện" belong to a
// topic — sharing one pair of inputs across two unrelated topics would silently give
// them the same numbers.
const TABS = [
  { key: 'part1', label: 'Part 1' },
  { key: 'part2', label: 'Part 2 + 3' },
];

const CATEGORIES = [
  { key: 'place', label: 'Place' },
  { key: 'people', label: 'People' },
  { key: 'education', label: 'Education' },
  { key: 'recreation', label: 'Recreation' },
  { key: 'object', label: 'Object' },
  { key: 'others', label: 'Others' },
];

const WORK_STUDY = [
  { key: 'neutral', label: 'Trung tính' },
  { key: 'work', label: 'Work' },
  { key: 'study', label: 'Study' },
];

const box = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 text-sm';
const label = 'block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5';

const SpeakingAdd = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('part1');

  // raw paste boxes
  const [part1Text, setPart1Text] = useState('');
  const [part2Text, setPart2Text] = useState('');
  const [followupText, setFollowupText] = useState('');
  const [part3Text, setPart3Text] = useState('');

  // per-topic settings
  const [isImportant, setIsImportant] = useState(false);
  const [workStudy, setWorkStudy] = useState('neutral');
  const [category, setCategory] = useState('');
  const [occurrence, setOccurrence] = useState(0);
  const [window_, setWindow] = useState('');

  // editable preview
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);   // topic đã lưu trong phiên này

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };

  const resetAll = () => {
    setPart1Text(''); setPart2Text(''); setFollowupText(''); setPart3Text('');
    setIsImportant(false); setWorkStudy('neutral'); setCategory('');
    setOccurrence(0); setWindow(''); setDraft(null);
  };

  const doPreview = async () => {
    const body = tab === 'part1'
      ? { part1_text: part1Text }
      : { part2_text: part2Text, followup_text: followupText, part3_text: part3Text };
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/preview`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Không tách được nội dung');
      setDraft(data.preview);
    } catch (e) { toast.error(e.message); }
  };

  // The preview is editable, so the text sent on save is rebuilt from the rows the
  // admin is actually looking at — parsing is line-based, so joining them back with
  // newlines round-trips exactly.
  const joinLines = (title, questions) => [title, ...questions].filter((l) => (l || '').trim()).join('\n');

  const doSave = async () => {
    if (!draft) return;
    const body = {
      occurrence_count: Number(occurrence) || 0,
      appear_window: window_ || null,
    };
    if (tab === 'part1') {
      const p = draft.part1 || {};
      if (!(p.title || '').trim()) return toast.error('Chưa có tên topic');
      body.part1_text = joinLines(p.title, p.questions || []);
      body.is_important = isImportant;
      body.work_study = workStudy;
    } else {
      const p = draft.part2 || {};
      if (!(p.title || '').trim()) return toast.error('Chưa có tên topic Part 2');
      // The whole Part 2 block, first line included, is the cue card the student sees.
      body.part2_text = (p.cue_card || '').trim();
      body.followup_text = (p.followups || []).filter((l) => (l || '').trim()).join('\n');
      body.part3_text = ((p.part3 || {}).questions || []).filter((l) => (l || '').trim()).join('\n');
      body.category = category || null;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/speaking/topics`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Lưu thất bại');
      const n = (data.created || []).map((c) => c.title).join(', ');
      // Generation starts behind the response, so say so — otherwise it looks like
      // nothing happened until someone opens the management table minutes later.
      toast.success(`Đã lưu: ${n}. Đang sinh dàn bài và từ vựng ở nền, xem tiến độ ở trang Quản lý topic.`,
                    { autoClose: 6000 });
      setSaved((prev) => [...prev, ...(data.created || [])]);
      resetAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // ── helpers to edit the draft in place ──
  const setP1 = (patch) => setDraft((d) => ({ ...d, part1: { ...d.part1, ...patch } }));
  const setP2 = (patch) => setDraft((d) => ({ ...d, part2: { ...d.part2, ...patch } }));
  const editList = (list, i, value) => list.map((v, k) => (k === i ? value : v));

  const QuestionRows = ({ items, onChange, addLabel }) => (
    <div className="space-y-1.5">
      {items.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-xs font-semibold text-gray-400 text-right">{i + 1}</span>
          <input value={q} onChange={(e) => onChange(editList(items, i, e.target.value))} className={box} />
          <button type="button" title="Xoá dòng"
                  onClick={() => onChange(items.filter((_, k) => k !== i))}
                  className="shrink-0 text-gray-400 hover:text-red-600 p-1">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0096b1] hover:text-[#007a90] mt-1">
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <ToastContainer position="top-right" autoClose={2500} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">

            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Thêm topic Speaking</h1>
              <button onClick={resetAll}
                      className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 mt-4 sm:mt-0">
                <RotateCcw size={16} /> Xoá hết, nhập lại
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {TABS.map((t) => (
                <button key={t.key}
                        onClick={() => { setTab(t.key); setDraft(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          tab === t.key
                            ? 'bg-[#0096b1] text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50'
                        }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ── cột nhập ── */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 space-y-4">
                {tab === 'part1' ? (
                  <>
                    <div>
                      <label className={label}>Nội dung Part 1</label>
                      <p className="text-xs text-gray-500 mb-2">Dòng đầu là tên topic, mỗi dòng sau là một câu hỏi.</p>
                      <textarea value={part1Text} onChange={(e) => setPart1Text(e.target.value)}
                                rows={14} className={`${box} font-mono`} placeholder={'Accommodation\nDo you live in a house or a flat?\nWhat is your favourite room?'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
                        Topic quan trọng
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Phân loại:</span>
                        {WORK_STUDY.map((w) => (
                          <label key={w.key} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <input type="radio" name="ws" checked={workStudy === w.key} onChange={() => setWorkStudy(w.key)} />
                            {w.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={label}>Part 2 — đề bài + cue card</label>
                      <p className="text-xs text-gray-500 mb-2">Dòng đầu là tên topic. Toàn bộ khối, kể cả dòng đầu, là đề bài học viên nhìn thấy.</p>
                      <textarea value={part2Text} onChange={(e) => setPart2Text(e.target.value)}
                                rows={8} className={`${box} font-mono`} placeholder={'Describe a person you admire\nYou should say:\n  who this person is\n  how you know them\n  what they do\nand explain why you admire them.'} />
                    </div>
                    <div>
                      <label className={label}>Follow-up questions</label>
                      <p className="text-xs text-gray-500 mb-2">Mỗi dòng một câu. Luôn gắn với topic Part 2 ở trên.</p>
                      <textarea value={followupText} onChange={(e) => setFollowupText(e.target.value)}
                                rows={4} className={`${box} font-mono`} />
                    </div>
                    <div>
                      <label className={label}>Part 3</label>
                      <p className="text-xs text-gray-500 mb-2">Mỗi dòng một câu. Topic tự đặt là "Part 3 - &lt;tên topic Part 2&gt;".</p>
                      <textarea value={part3Text} onChange={(e) => setPart3Text(e.target.value)}
                                rows={7} className={`${box} font-mono`} />
                    </div>
                    <div>
                      <span className={label}>Nhóm chủ đề</span>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                          <button key={c.key} type="button"
                                  onClick={() => setCategory(category === c.key ? '' : c.key)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    category === c.key
                                      ? 'bg-[#0096b1] text-white border-[#0096b1]'
                                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-[#0096b1]'
                                  }`}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className={label}>Occurrence times</label>
                    <input type="number" min={0} value={occurrence} onChange={(e) => setOccurrence(e.target.value)} className={box} />
                  </div>
                  <div>
                    <label className={label}>Thời gian xuất hiện</label>
                    <input value={window_} onChange={(e) => setWindow(e.target.value)} placeholder="05/2026 - 08/2026" className={box} />
                  </div>
                </div>

                <button onClick={doPreview}
                        className="btn bg-[#0096b1] text-white hover:bg-[#007a90] flex items-center gap-2 w-full justify-center">
                  <Eye size={16} /> Xem trước
                </button>
              </div>

              {/* ── cột xem trước, sửa được ── */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <h2 className="text-lg font-bold text-[#2b5356] dark:text-gray-100 mb-1">Xem trước</h2>
                <p className="text-xs text-gray-500 mb-4">Đây đúng là những dòng sẽ được lưu. Sửa trực tiếp ở đây trước khi lưu.</p>

                {!draft ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    Dán nội dung rồi bấm <b>Xem trước</b>.
                  </div>
                ) : tab === 'part1' ? (
                  <div className="space-y-4">
                    <div>
                      <label className={label}>Tên topic</label>
                      <input value={draft.part1?.title || ''} onChange={(e) => setP1({ title: e.target.value })}
                             className={`${box} font-semibold`} />
                    </div>
                    <div>
                      <label className={label}>Câu hỏi ({(draft.part1?.questions || []).length})</label>
                      <QuestionRows items={draft.part1?.questions || []}
                                    onChange={(v) => setP1({ questions: v })}
                                    addLabel="Thêm câu hỏi" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className={label}>Tên topic Part 2</label>
                      <input value={draft.part2?.title || ''} onChange={(e) => setP2({ title: e.target.value })}
                             className={`${box} font-semibold`} />
                    </div>
                    <div>
                      <label className={label}>Đề bài + cue card</label>
                      <textarea value={draft.part2?.cue_card || ''} onChange={(e) => setP2({ cue_card: e.target.value })}
                                rows={7} className={`${box} font-mono`} />
                      <p className="text-xs text-gray-500 mt-1">Dòng đầu của khối này cũng là tên topic khi lưu.</p>
                    </div>
                    <div>
                      <label className={label}>Follow-up ({(draft.part2?.followups || []).length})</label>
                      <QuestionRows items={draft.part2?.followups || []}
                                    onChange={(v) => setP2({ followups: v })}
                                    addLabel="Thêm follow-up" />
                    </div>
                    <div>
                      <label className={label}>
                        {draft.part2?.part3?.title || 'Part 3'} ({(draft.part2?.part3?.questions || []).length})
                      </label>
                      <QuestionRows items={draft.part2?.part3?.questions || []}
                                    onChange={(v) => setP2({ part3: { ...draft.part2.part3, questions: v } })}
                                    addLabel="Thêm câu Part 3" />
                      <p className="text-xs text-gray-500 mt-2">
                        Part 3 lưu chung gói với topic Part 2, không đứng thành topic riêng.
                      </p>
                    </div>
                  </div>
                )}

                {saved.length > 0 && (
                  <div className="mt-6 rounded-lg border border-[#0096b1]/30 bg-[#0096b1]/5 p-3">
                    <p className="text-sm font-semibold text-[#2b5356] mb-1.5">
                      Đã lưu trong phiên này ({saved.length})
                    </p>
                    <ul className="text-sm text-gray-600 space-y-0.5 mb-2">
                      {saved.map((c, i) => <li key={i}>• {c.title}</li>)}
                    </ul>
                    <Link to="/speaking-topics"
                          className="text-sm font-semibold text-[#0096b1] hover:text-[#007a90] hover:underline">
                      Sang trang Quản lý topic để xem nội dung AI →
                    </Link>
                  </div>
                )}

                {draft && (
                  <button onClick={doSave} disabled={saving}
                          className="btn bg-[#eb7e37] text-white hover:bg-[#d96f2b] disabled:opacity-50 flex items-center gap-2 w-full justify-center mt-6">
                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SpeakingAdd;
