import React, { useRef, useEffect } from 'react';
import { API_BASE } from '../../config/api';

// Lightweight, dependency-free rich-text editor for the "Thông tin mới" body
// (NO TinyMCE). Plain contentEditable + a small toolbar. Inserted images are
// UPLOADED to the backend (/admin/action/upload-image) and referenced by their
// absolute /static URL — never base64 (which would overflow the MySQL TEXT col).
export default function AnnouncementEditor({ value, onChange }) {
  const ref = useRef(null);
  const fileRef = useRef(null);

  // Load initial HTML on mount, and re-sync when `value` changes externally
  // (e.g. opening a different item) WITHOUT clobbering the caret while typing.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && (value || '') !== el.innerHTML) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const exec = (command, arg) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const onPickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/admin/action/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: fd,
      });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      // Global's upload-image returns an absolute R2 URL; it only falls back to a
      // relative /static path when R2 is misconfigured (see CLAUDE.md).
      const url = /^https?:\/\//.test(data.image_url) ? data.image_url : `${API_BASE}${data.image_url}`;
      ref.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;height:auto;border-radius:8px;" /><p><br/></p>`);
      emit();
    } catch (err) {
      alert('Không tải được ảnh');
    }
  };

  const Btn = ({ onClick, title, children }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      title={title}
      className="px-2.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <style>{`.ann-editor:empty:before{content:attr(data-ph);color:#9ca3af;}`}</style>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
        <Btn onClick={() => exec('bold')} title="Đậm"><b>B</b></Btn>
        <Btn onClick={() => exec('italic')} title="Nghiêng"><i>I</i></Btn>
        <Btn onClick={() => exec('underline')} title="Gạch chân"><u>U</u></Btn>
        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <Btn onClick={() => exec('insertUnorderedList')} title="Danh sách">• List</Btn>
        <Btn onClick={() => exec('formatBlock', 'h3')} title="Tiêu đề nhỏ">H</Btn>
        <Btn onClick={() => { const u = window.prompt('Nhập link:'); if (u) exec('createLink', u); }} title="Chèn link">🔗</Btn>
        <Btn onClick={() => fileRef.current && fileRef.current.click()} title="Chèn hình">🖼️ Hình</Btn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>
      <div
        ref={ref}
        className="ann-editor min-h-[180px] max-h-[360px] overflow-y-auto px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
        style={{ lineHeight: 1.6 }}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-ph="Nhập nội dung… (có thể chèn hình)"
      />
    </div>
  );
}
