import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_BASE } from '../../config/api';
import AnnouncementEditor from '../../components/editor/AnnouncementEditor';

const EMPTY_FORM = {
    icon: '📢',
    title: '',
    content: '',
    link: '',
    is_important: false,
    display_order: 0,
    is_active: true,
};

const ICON_SUGGESTIONS = ['📢', '🔥', '🆕', '📅', '🎯', '⭐', '📊', '✅'];

function Announcements() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const getToken = () => localStorage.getItem('access_token');

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/announcements`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                setItems(await res.json());
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditingId(item.announcement_id);
        setForm({
            icon: item.icon || '',
            title: item.title || '',
            content: item.content || '',
            link: item.link || '',
            is_important: !!item.is_important,
            display_order: item.display_order || 0,
            is_active: !!item.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() && !form.content.trim()) {
            alert('Cần có tiêu đề hoặc nội dung');
            return;
        }
        setSaving(true);
        try {
            const isEdit = editingId !== null;
            const url = isEdit
                ? `${API_BASE}/admin/announcements/${editingId}`
                : `${API_BASE}/admin/announcements`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    icon: form.icon || null,
                    title: form.title ? form.title.trim() : null,
                    content: form.content ? form.content.trim() : null,
                    link: form.link ? form.link.trim() : null,
                    is_important: form.is_important,
                    display_order: Number(form.display_order) || 0,
                    is_active: form.is_active,
                })
            });
            if (res.ok) {
                setShowModal(false);
                setForm(EMPTY_FORM);
                setEditingId(null);
                fetchItems();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || 'Không thể lưu thông tin');
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('Đã xảy ra lỗi khi lưu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa thông tin này?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) fetchItems();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const toggleActive = async (item) => {
        try {
            const res = await fetch(`${API_BASE}/admin/announcements/${item.announcement_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ is_active: !item.is_active })
            });
            if (res.ok) fetchItems();
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    return (
        <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                        {/* Header */}
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                    Thông Tin Mới (Trang Chủ)
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Các mục hiển thị ở khu "Thông tin mới" đầu trang chủ. Mục "Quan trọng" luôn được ghim lên đầu.
                                </p>
                            </div>
                            <button
                                onClick={openCreate}
                                className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white mt-4 sm:mt-0"
                            >
                                <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                </svg>
                                <span className="max-xs:sr-only">Thêm Thông Tin</span>
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                                <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                                    Danh sách ({items.length})
                                </h2>
                            </header>
                            <div className="overflow-x-auto p-3">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Đang tải...</div>
                                ) : items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Chưa có thông tin nào</div>
                                ) : (
                                    <table className="table-auto w-full">
                                        <thead className="text-xs uppercase text-gray-400 dark:text-gray-500">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Icon</th>
                                                <th className="px-3 py-2 text-left">Tiêu đề</th>
                                                <th className="px-3 py-2 text-left">Link</th>
                                                <th className="px-3 py-2 text-center">Quan trọng</th>
                                                <th className="px-3 py-2 text-center">Thứ tự</th>
                                                <th className="px-3 py-2 text-center">Hiển thị</th>
                                                <th className="px-3 py-2 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                                            {items.map(item => (
                                                <tr key={item.announcement_id}>
                                                    <td className="px-3 py-3 text-xl">{item.icon || '•'}</td>
                                                    <td className="px-3 py-3 text-gray-800 dark:text-gray-100 max-w-md">
                                                        {item.title || (item.content ? item.content.replace(/<[^>]*>/g, ' ').trim().slice(0, 80) : '—')}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-500 max-w-[160px] truncate">
                                                        {item.link || '—'}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {item.is_important ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-500/20 rounded-full px-2 py-0.5">
                                                                📌 Ghim
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-gray-500">{item.display_order}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <button
                                                            onClick={() => toggleActive(item)}
                                                            className={`text-xs font-medium rounded-full px-2 py-0.5 ${item.is_active
                                                                ? 'text-green-700 bg-green-100 dark:bg-green-500/20'
                                                                : 'text-gray-500 bg-gray-100 dark:bg-gray-700'
                                                                }`}
                                                        >
                                                            {item.is_active ? 'Bật' : 'Tắt'}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="text-indigo-500 hover:text-indigo-600 font-medium mr-3"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.announcement_id)}
                                                            className="text-red-500 hover:text-red-600 font-medium"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                            {editingId ? 'Sửa Thông Tin' : 'Thêm Thông Tin'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (emoji)</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    value={form.icon}
                                    maxLength={4}
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                    placeholder="📢"
                                />
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {ICON_SUGGESTIONS.map(emo => (
                                        <button
                                            key={emo}
                                            type="button"
                                            onClick={() => setForm({ ...form, icon: emo })}
                                            className="text-lg w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề *</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Vd: Thêm 15 đề Reading và 10 đề Listening mới"
                                />
                                <p className="text-xs text-gray-400 mt-1">Tiêu đề hiển thị ở trang chủ; bấm vào sẽ mở trang đọc nội dung.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung (có thể chèn hình)</label>
                                <AnnouncementEditor
                                    value={form.content}
                                    onChange={(html) => setForm({ ...form, content: html })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link ngoài (tuỳ chọn — nếu có sẽ mở link thay vì trang đọc)</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    value={form.link}
                                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                                    placeholder="/reading hoặc https://..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
                                    <input
                                        type="number"
                                        className="form-input w-full"
                                        value={form.display_order}
                                        onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-end gap-2 pb-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={form.is_important}
                                            onChange={(e) => setForm({ ...form, is_important: e.target.checked })}
                                        />
                                        Quan trọng (ghim)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        />
                                        Hiển thị
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowModal(false); setEditingId(null); setForm(EMPTY_FORM); }}
                                className="btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 text-gray-600 dark:text-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Announcements;
