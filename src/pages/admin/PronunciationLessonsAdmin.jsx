import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { Plus, Save, Trash2, Sparkles, Loader2, Eye, EyeOff, Bold } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '../../config/api';

// Pronunciation Lessons (feedback 09/09).
//
// Mỗi Unit gồm hai nửa: LÝ THUYẾT admin gõ tay, và LUYỆN TẬP do AI sinh từ chính lý
// thuyết đó. Vì thế màn này là hai cột: trái là danh sách Unit, phải là trình soạn của
// Unit đang chọn cùng bộ luyện tập vừa sinh — admin xem được ngay AI ra cái gì trước khi
// bấm xuất bản.
//
// Bộ ở đây là bộ MẶC ĐỊNH mọi học viên nhìn thấy. Học viên VIP bấm "Làm mới nội dung
// luyện tập" sẽ có bộ riêng của họ, không ghi đè lên bộ này.

// In đậm bằng `**chữ**` (feedback 19/09). Cùng một luật với trang học viên
// (ielts-tajun/.../PronunciationLessons.js `renderBold`) để khung xem trước ở đây khớp
// đúng thứ học viên nhìn thấy. Dựng phần tử React, không dùng innerHTML.
const renderBold = (text) => {
  const parts = String(text || '').split('**');
  if (parts.length < 3) return text;
  return parts.map((chunk, i) => {
    if (i % 2 === 1 && i < parts.length - 1) return <strong key={i}>{chunk}</strong>;
    if (i % 2 === 1) return <React.Fragment key={i}>{'**' + chunk}</React.Fragment>;
    return <React.Fragment key={i}>{chunk}</React.Fragment>;
  });
};

const box = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 text-sm';
const label = 'block text-sm font-semibold text-[#2b5356] dark:text-gray-200 mb-1.5';

const PronunciationLessonsAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [units, setUnits] = useState([]);
  const [current, setCurrent] = useState(null);   // unit đang soạn (null = chưa chọn)
  const [title, setTitle] = useState('');
  const [theory, setTheory] = useState('');
  const theoryRef = useRef(null);

  // Bọc đoạn đang bôi đen bằng ** **; bôi lại đúng đoạn đó để bấm thêm lần nữa là gỡ được.
  // Không bôi gì thì chèn cặp ** ** và đặt con trỏ vào giữa.
  const toggleBold = () => {
    const el = theoryRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b);
    let next, from, to;
    if (value.slice(a - 2, a) === '**' && value.slice(b, b + 2) === '**') {
      next = value.slice(0, a - 2) + sel + value.slice(b + 2);   // đang đậm → gỡ
      from = a - 2; to = b - 2;
    } else {
      next = value.slice(0, a) + '**' + sel + '**' + value.slice(b);
      from = a + 2; to = b + 2;
    }
    setTheory(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from, to); });
  };
  const [published, setPublished] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState('');

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };

  const call = useCallback(async (path, options) => {
    const res = await fetch(`${API_BASE}/admin/speaking${path}`, {
      headers: authHeaders, ...(options || {}),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).detail; } catch (e) { /* body rỗng */ }
      // FastAPI trả đúng chữ "Not Found" khi đường dẫn chưa tồn tại, và toast đổ nguyên
      // chữ đó ra màn hình — admin đọc một xâu tiếng Anh vô nghĩa rồi bấm lại, mỗi lần bấm
      // lại thêm một toast đỏ (ảnh feedback 15/09 có tám cái chồng lên nhau). Ba mã này
      // nói rõ chuyện gì đang xảy ra để biết là lỗi hệ thống hay lỗi quyền.
      if (res.status === 404 && (!detail || detail === 'Not Found')) {
        throw new Error('Máy chủ chưa có API Pronunciation Lessons — bản backend đang chạy cũ hơn giao diện, cần deploy lại backend.');
      }
      if (res.status === 401) throw new Error('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.');
      if (res.status === 403) throw new Error('Tài khoản này không có quyền quản lý Pronunciation Lessons.');
      throw new Error(detail || 'Không kết nối được máy chủ.');
    }
    return res.json();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUnits = useCallback(() => {
    call('/pron-units')
      .then((d) => setUnits(d.units || []))
      .catch((e) => toast.error(e.message));
  }, [call]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const openUnit = async (unitId) => {
    try {
      const d = await call(`/pron-units/${unitId}`);
      setCurrent(d.unit_id);
      setTitle(d.title || '');
      setTheory(d.theory || '');
      setPublished(!!d.is_published);
      setItems(d.items || []);
    } catch (e) { toast.error(e.message); }
  };

  const newUnit = () => {
    setCurrent('new'); setTitle(''); setTheory(''); setPublished(false); setItems([]);
  };

  const save = async () => {
    if (!title.trim()) { toast.error('Hãy nhập tiêu đề Unit.'); return; }
    setBusy('save');
    try {
      const body = JSON.stringify({ title, theory, is_published: published });
      if (current === 'new') {
        const d = await call('/pron-units', { method: 'POST', body });
        setCurrent(d.unit_id);
        toast.success('Đã tạo Unit. Bấm "AI tạo bài luyện tập" để sinh nội dung.');
      } else {
        await call(`/pron-units/${current}`, { method: 'PUT', body });
        toast.success('Đã lưu.');
      }
      loadUnits();
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  const generate = async () => {
    if (current === 'new') { toast.error('Hãy lưu Unit trước đã.'); return; }
    setBusy('generate');
    try {
      const d = await call(`/pron-units/${current}/generate`, { method: 'POST' });
      setItems(d.items || []);
      toast.success(`AI đã tạo ${(d.items || []).length} mục luyện tập.`);
      loadUnits();
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  const remove = async (unitId) => {
    // Xoá Unit là xoá luôn bộ luyện tập của nó — hỏi lại một lần cho chắc.
    if (!window.confirm('Xoá Unit này cùng toàn bộ nội dung luyện tập?')) return;
    try {
      await call(`/pron-units/${unitId}`, { method: 'DELETE' });
      if (current === unitId) setCurrent(null);
      loadUnits();
      toast.success('Đã xoá.');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Pronunciation Lessons
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Nhập lý thuyết, rồi để AI ra bộ từ và câu luyện tập bám đúng bài đó.
                </p>
              </div>
              <button onClick={newUnit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                <Plus size={17} /> Thêm Unit
              </button>
            </div>

            <div className="grid lg:grid-cols-[300px_1fr] gap-6">
              <aside className="space-y-2">
                {!units.length && (
                  <p className="text-sm text-gray-500">Chưa có Unit nào.</p>
                )}
                {units.map((u) => (
                  <div key={u.unit_id}
                    className={`rounded-xl border-2 px-4 py-3 ${
                      current === u.unit_id ? 'border-[#0096b1] bg-[#0096b1]/5'
                        : 'border-gray-200 dark:border-gray-700'}`}>
                    <button type="button" onClick={() => openUnit(u.unit_id)}
                      className="text-left w-full">
                      <p className="font-bold text-[#2b5356] dark:text-gray-100 break-words">{u.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {u.practice_count} mục · {u.is_published ? 'Đang hiển thị' : 'Chưa xuất bản'}
                      </p>
                    </button>
                    <button type="button" onClick={() => remove(u.unit_id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
                      <Trash2 size={13} /> Xoá
                    </button>
                  </div>
                ))}
              </aside>

              <section>
                {current === null ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500">
                    Chọn một Unit bên trái, hoặc bấm “Thêm Unit”.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className={label}>Tiêu đề Unit</label>
                      <input className={box} value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: Unit 1: /ɪ/ and /iː/" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <label className={label + ' !mb-0'}>Nội dung lý thuyết</label>
                        <button type="button" onClick={toggleBold} title="In đậm (Ctrl/Cmd + B)"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-300
                                     text-sm font-bold text-[#2b5356] hover:border-[#0096b1] hover:text-[#0096b1]">
                          <Bold size={14} /> In đậm
                        </button>
                      </div>
                      <textarea ref={theoryRef} className={box} rows={12} value={theory}
                        onChange={(e) => setTheory(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                            e.preventDefault(); toggleBold();
                          }
                        }}
                        placeholder="Cách phát âm, khẩu hình, cách phân biệt hai âm, ví dụ và các lỗi thường gặp…" />
                      <p className="text-xs text-gray-500 mt-1">
                        AI đọc đúng phần này để ra bài luyện tập, nên viết càng rõ âm cần dạy càng tốt.
                        Bôi đen rồi bấm <b>In đậm</b> (hoặc Ctrl/Cmd + B) — chữ nằm giữa hai cặp <code>**</code> sẽ in đậm.
                      </p>
                      {theory.includes('**') && (
                        <div className="mt-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">Học viên sẽ thấy:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200 leading-7 whitespace-pre-line break-words">
                            {renderBold(theory)}
                          </p>
                        </div>
                      )}
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b5356] dark:text-gray-200">
                      <input type="checkbox" className="w-4 h-4 accent-[#0096b1]"
                        checked={published} onChange={(e) => setPublished(e.target.checked)} />
                      {published ? <Eye size={16} /> : <EyeOff size={16} />}
                      Hiển thị cho học viên
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button onClick={save} disabled={busy === 'save'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90] disabled:opacity-50">
                        {busy === 'save' ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Lưu
                      </button>
                      <button onClick={generate} disabled={busy === 'generate' || current === 'new'}
                        title={current === 'new' ? 'Lưu Unit trước đã' : undefined}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#eb7e37] text-white font-semibold hover:bg-[#d86f2b] disabled:opacity-50">
                        {busy === 'generate' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        AI tạo bài luyện tập
                      </button>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-[#2b5356] dark:text-gray-100 mb-2">
                        Bài luyện tập ({items.length})
                      </h2>
                      {!items.length ? (
                        <p className="text-sm text-gray-500">
                          Chưa có. Nhập lý thuyết, lưu lại, rồi bấm “AI tạo bài luyện tập”.
                        </p>
                      ) : (
                        <ol className="space-y-2">
                          {items.map((it, i) => (
                            <li key={it.item_id}
                              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
                              <span className={`inline-block mr-2 px-2 py-0.5 rounded text-[11px] font-bold ${
                                it.kind === 'sentence' ? 'bg-[#eb7e37]/15 text-[#c25f1c]'
                                  : 'bg-[#0096b1]/15 text-[#0096b1]'}`}>
                                {it.kind === 'sentence' ? 'Shadowing' : 'Phát âm'}
                              </span>
                              <span className="font-semibold text-gray-800 dark:text-gray-100 break-words">
                                {i + 1}. {it.content}
                              </span>
                              {it.note && (
                                <span className="block text-xs text-gray-500 mt-0.5 break-words">{it.note}</span>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default PronunciationLessonsAdmin;
