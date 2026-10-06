import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { Save, RefreshCw } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

// Canonical reading/listening question types. Values must match the keys in the
// student app's questionTypeStats.js label map so the stats/teacher breakdown
// resolve nice labels.
const QUESTION_TYPES = [
  { value: '', label: '— Chưa phân loại —' },
  { value: 'true_false_not_given', label: 'True / False / Not Given' },
  { value: 'yes_no_not_given', label: 'Yes / No / Not Given' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'multiple_choice', label: 'Multiple Choice (One Answer)' },
  { value: 'multiple_choice_many', label: 'Multiple Choice (Many Answers)' },
  { value: 'matching_information', label: 'Matching Information' },
  { value: 'matching_headings', label: 'Matching Headings' },
  { value: 'matching_names', label: 'Matching Names / Features' },
  { value: 'matching_features_dragdrop', label: 'Matching Features (Kéo thả)' },
  { value: 'matching_features_table', label: 'Matching Features (Table)' },
  { value: 'matching_sentence_endings', label: 'Matching Sentence Endings' },
  { value: 'sentence_completion', label: 'Sentence Completion' },
  { value: 'summary_completion', label: 'Summary Completion' },
  { value: 'summary_completion_wordlist', label: 'Summary Completion (With Word List)' },
  { value: 'note_completion', label: 'Note Completion' },
  { value: 'table_completion', label: 'Table Completion' },
  { value: 'form_completion', label: 'Form Completion' },
  { value: 'flow_chart_completion', label: 'Flow Chart Completion' },
  { value: 'diagram_labelling', label: 'Diagram Labelling' },
  { value: 'map_labelling', label: 'Map Labelling' },
  { value: 'short_answer', label: 'Short Answer' },
];

// Writing task categories. Values match ManageForecast.jsx and the student
// questionTypeStats.js label map. Task 1 vs Task 2 pick by part_number.
const WRITING_TASK1_TYPES = [
  { value: '', label: '— Chưa phân loại —' },
  { value: 'line', label: 'Line graph' },
  { value: 'bar', label: 'Bar chart' },
  { value: 'pie', label: 'Pie chart' },
  { value: 'table', label: 'Table' },
  { value: 'map', label: 'Map' },
  { value: 'process', label: 'Process' },
  { value: 'mixed_task1', label: 'Mixed (Task 1)' },
];
const WRITING_TASK2_TYPES = [
  { value: '', label: '— Chưa phân loại —' },
  { value: 'agree_disagree', label: 'Agree or disagree' },
  { value: 'negative_positive', label: 'Negative or positive' },
  { value: 'advantages_disadvantages', label: 'Advantages & disadvantages' },
  { value: 'discuss_opinion', label: 'Discuss both views + opinion' },
  { value: 'solutions_effects', label: 'Causes / Solutions / Effects' },
  { value: 'two_parts_mixed', label: 'Two-part / Mixed' },
];
const writingTypesFor = (partNumber) => (partNumber === 2 ? WRITING_TASK2_TYPES : WRITING_TASK1_TYPES);

const QuestionTyping = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState('rl'); // 'rl' = reading/listening | 'writing'
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [examOpen, setExamOpen] = useState(false);
  const [examData, setExamData] = useState(null);
  const [assignments, setAssignments] = useState({}); // question_id/task_id -> type
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulk, setBulk] = useState({}); // section_id -> { type, from, to }

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };

  const isWriting = mode === 'writing';

  const fetchExams = useCallback(async () => {
    try {
      const url = mode === 'writing'
        ? `${API_BASE}/admin/question-typing/writing-exams`
        : `${API_BASE}/admin/question-typing/exams`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error('Không tải được danh sách đề');
      const data = await res.json();
      setExams(data.exams || []);
    } catch (e) {
      toast.error(e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setSelectedExamId('');
    setExamSearch('');
    setExamData(null);
    setAssignments({});
    setBulk({});
  };

  const loadExam = async (examId, forWriting = isWriting) => {
    if (!examId) {
      setExamData(null);
      setAssignments({});
      return;
    }
    setLoading(true);
    try {
      const url = forWriting
        ? `${API_BASE}/admin/question-typing/writing/${examId}`
        : `${API_BASE}/admin/question-typing/exam/${examId}`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error('Không tải được nội dung của đề');
      const data = await res.json();
      setExamData(data);
      const init = {};
      if (forWriting) {
        (data.tasks || []).forEach((t) => { init[t.task_id] = t.question_type || ''; });
      } else {
        (data.sections || []).forEach((s) =>
          (s.questions || []).forEach((q) => { init[q.question_id] = q.question_type || ''; })
        );
      }
      setAssignments(init);
      setBulk({});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const setType = (id, type) => {
    setAssignments((prev) => ({ ...prev, [id]: type }));
  };

  const applyBulk = (section) => {
    const cfg = bulk[section.section_id] || {};
    const type = cfg.type ?? '';
    const from = parseInt(cfg.from, 10);
    const to = parseInt(cfg.to, 10);
    if (Number.isNaN(from) || Number.isNaN(to)) {
      toast.error('Nhập khoảng câu hợp lệ');
      return;
    }
    setAssignments((prev) => {
      const next = { ...prev };
      section.questions.forEach((q) => {
        if (q.question_number >= from && q.question_number <= to) {
          next[q.question_id] = type;
        }
      });
      return next;
    });
    toast.success(`Đã gán câu ${from}–${to}`);
  };

  const save = async () => {
    if (!selectedExamId) return;
    setSaving(true);
    try {
      let url, payload;
      if (isWriting) {
        url = `${API_BASE}/admin/question-typing/writing/${selectedExamId}`;
        // Send ALL tasks (including cleared ones) so un-setting a type persists.
        payload = {
          assignments: Object.entries(assignments)
            .map(([task_id, question_type]) => ({ task_id: parseInt(task_id, 10), question_type: question_type || '' })),
        };
      } else {
        url = `${API_BASE}/admin/question-typing/exam/${selectedExamId}`;
        payload = {
          assignments: Object.entries(assignments)
            .filter(([, type]) => type) // only send typed ones
            .map(([question_id, question_type]) => ({ question_id: parseInt(question_id, 10), question_type })),
        };
      }
      const res = await fetch(url, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Lưu thất bại');
      const data = await res.json();
      toast.success(`Đã lưu ${data.updated} ${isWriting ? 'task' : 'câu'}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <ToastContainer position="top-right" autoClose={2000} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                Gán dạng câu hỏi
              </h1>
              {examData && (
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn bg-[#0096b1] text-white hover:bg-[#007a90] mt-4 sm:mt-0 flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            {/* Skill mode toggle */}
            <div className="inline-flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg mb-6">
              <button
                onClick={() => switchMode('rl')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  mode === 'rl' ? 'bg-white dark:bg-gray-800 text-[#0096b1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reading / Listening
              </button>
              <button
                onClick={() => switchMode('writing')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  mode === 'writing' ? 'bg-white dark:bg-gray-800 text-[#0096b1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Writing
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={examSearch}
                  onChange={(e) => { setExamSearch(e.target.value); setExamOpen(true); }}
                  onFocus={() => setExamOpen(true)}
                  onBlur={() => setTimeout(() => setExamOpen(false), 150)}
                  placeholder="— Chọn đề — (gõ để tìm)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                />
                {examOpen && (() => {
                  const q = examSearch.toLowerCase();
                  const matches = exams.filter((ex) => (ex.title || '').toLowerCase().includes(q));
                  return (
                    <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
                      {matches.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy đề</div>
                      ) : matches.slice(0, 100).map((ex) => (
                        <button
                          key={ex.exam_id}
                          onMouseDown={() => {
                            setSelectedExamId(String(ex.exam_id));
                            loadExam(String(ex.exam_id));
                            setExamSearch(ex.title);
                            setExamOpen(false);
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${String(ex.exam_id) === selectedExamId ? 'bg-[#0096b1]/10' : ''}`}
                        >
                          {ex.title} {ex.skills?.length ? `(${ex.skills.join(', ')})` : ''}{ex.is_active ? '' : ' [ẩn]'}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={fetchExams}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Làm mới danh sách đề"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Đang tải...</div>
            ) : !examData ? (
              <div className="text-center py-16 text-gray-400">Chọn một đề để bắt đầu gán dạng câu hỏi.</div>
            ) : isWriting ? (
              /* ---------------- Writing mode: one type per Task ---------------- */
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl divide-y divide-gray-50 dark:divide-gray-700/40">
                {(examData.tasks || []).map((t) => (
                  <div key={t.task_id} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-28 shrink-0 font-semibold text-gray-700 dark:text-gray-300">
                      Task {t.part_number || '?'}
                    </span>
                    <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {t.title || <em className="text-gray-300">(không có tiêu đề)</em>}
                    </span>
                    <select
                      value={assignments[t.task_id] ?? ''}
                      onChange={(e) => setType(t.task_id, e.target.value)}
                      className={`shrink-0 w-72 rounded-lg text-sm py-1.5 border ${
                        assignments[t.task_id]
                          ? 'border-[#0096b1] text-gray-800 dark:text-gray-100'
                          : 'border-gray-300 text-gray-400'
                      } dark:bg-gray-700 dark:border-gray-600`}
                    >
                      {writingTypesFor(t.part_number).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {(examData.tasks || []).length === 0 && (
                  <div className="px-5 py-4 text-sm text-gray-400">Đề này chưa có task writing.</div>
                )}
              </div>
            ) : (
              /* ---------------- Reading / Listening mode ---------------- */
              <div className="space-y-6">
                {examData.sections.map((section) => (
                  <div key={section.section_id} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                        Part {section.order_number}
                        {section.part_title ? ` — ${section.part_title}` : ''}
                        <span className="ml-2 text-xs font-normal text-gray-400 capitalize">{section.section_type}</span>
                      </h2>
                      {/* Gán nhanh theo khoảng câu */}
                      <div className="flex items-center gap-2 text-sm">
                        <select
                          value={(bulk[section.section_id]?.type) ?? ''}
                          onChange={(e) => setBulk((p) => ({ ...p, [section.section_id]: { ...p[section.section_id], type: e.target.value } }))}
                          className="rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-sm py-1"
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <input
                          type="number" placeholder="từ câu"
                          value={bulk[section.section_id]?.from ?? ''}
                          onChange={(e) => setBulk((p) => ({ ...p, [section.section_id]: { ...p[section.section_id], from: e.target.value } }))}
                          className="w-20 rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-sm py-1"
                        />
                        <input
                          type="number" placeholder="đến câu"
                          value={bulk[section.section_id]?.to ?? ''}
                          onChange={(e) => setBulk((p) => ({ ...p, [section.section_id]: { ...p[section.section_id], to: e.target.value } }))}
                          className="w-20 rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-sm py-1"
                        />
                        <button
                          onClick={() => applyBulk(section)}
                          className="px-3 py-1 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-800"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                      {section.questions.map((q) => (
                        <div key={q.question_id} className="flex items-center gap-4 px-5 py-2.5">
                          <span className="w-12 shrink-0 font-semibold text-gray-700 dark:text-gray-300">
                            Câu {q.question_number}
                          </span>
                          <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                            {q.preview || <em className="text-gray-300">(không có nội dung)</em>}
                          </span>
                          <select
                            value={assignments[q.question_id] ?? ''}
                            onChange={(e) => setType(q.question_id, e.target.value)}
                            className={`shrink-0 w-64 rounded-lg text-sm py-1.5 border ${
                              assignments[q.question_id]
                                ? 'border-[#0096b1] text-gray-800 dark:text-gray-100'
                                : 'border-gray-300 text-gray-400'
                            } dark:bg-gray-700 dark:border-gray-600`}
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      {section.questions.length === 0 && (
                        <div className="px-5 py-4 text-sm text-gray-400">Part này chưa có câu hỏi.</div>
                      )}
                    </div>
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

export default QuestionTyping;
