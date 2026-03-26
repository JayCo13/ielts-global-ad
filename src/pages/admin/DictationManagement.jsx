import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import API_BASE from '../../config/api';

const WORDS_PER_PAGE = 5;

function DictationManagement() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [unitWords, setUnitWords] = useState([]);
    const [wordsPage, setWordsPage] = useState(1);

    // Form states
    const [showUnitForm, setShowUnitForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [unitName, setUnitName] = useState('');
    const [unitDescription, setUnitDescription] = useState('');

    // Word input states
    const [wordInputs, setWordInputs] = useState(Array(5).fill(''));
    const [saving, setSaving] = useState(false);

    const getToken = () => localStorage.getItem('access_token');

    const fetchUnits = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnits(data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnitWords = useCallback(async (unitId) => {
        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units/${unitId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnitWords(data.words);
                setWordsPage(1);
            }
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }, []);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        if (selectedUnit) {
            fetchUnitWords(selectedUnit.unit_id);
        }
    }, [selectedUnit, fetchUnitWords]);

    const handleCreateUnit = async () => {
        if (!unitName.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ name: unitName, description: unitDescription })
            });

            if (res.ok) {
                setShowUnitForm(false);
                setUnitName('');
                setUnitDescription('');
                fetchUnits();
            }
        } catch (error) {
            console.error('Error creating unit:', error);
        }
    };

    const handleUpdateUnit = async () => {
        if (!unitName.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units/${editingUnit.unit_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ name: unitName, description: unitDescription })
            });

            if (res.ok) {
                setEditingUnit(null);
                setUnitName('');
                setUnitDescription('');
                fetchUnits();
            }
        } catch (error) {
            console.error('Error updating unit:', error);
        }
    };

    const handleDeleteUnit = async (unitId) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài này?')) return;

        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units/${unitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            if (res.ok) {
                if (selectedUnit?.unit_id === unitId) {
                    setSelectedUnit(null);
                    setUnitWords([]);
                }
                fetchUnits();
            }
        } catch (error) {
            console.error('Error deleting unit:', error);
        }
    };

    const handleAddWords = async () => {
        const wordsToAdd = wordInputs.filter(w => w.trim());
        if (wordsToAdd.length === 0) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/admin/dictation/units/${selectedUnit.unit_id}/words`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ words: wordsToAdd })
            });

            if (res.ok) {
                setWordInputs(Array(5).fill(''));
                fetchUnitWords(selectedUnit.unit_id);
                fetchUnits();
            }
        } catch (error) {
            console.error('Error adding words:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWord = async (wordId) => {
        try {
            const res = await fetch(`${API_BASE}/admin/dictation/words/${wordId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            if (res.ok) {
                fetchUnitWords(selectedUnit.unit_id);
                fetchUnits();
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    };

    const handleToggleImportant = async (wordId, currentValue) => {
        try {
            const res = await fetch(`${API_BASE}/admin/dictation/words/${wordId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ is_important: !currentValue })
            });

            if (res.ok) {
                fetchUnitWords(selectedUnit.unit_id);
                fetchUnits();
            }
        } catch (error) {
            console.error('Error toggling important:', error);
        }
    };

    const totalWordsPages = Math.ceil(wordInputs.length / WORDS_PER_PAGE);
    const currentPageInputs = wordInputs.slice(
        (wordsPage - 1) * WORDS_PER_PAGE,
        wordsPage * WORDS_PER_PAGE
    );

    return (
        <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                        {/* Header */}
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                Quản Lý Bài Chép Chính Tả
                            </h1>
                            <button
                                onClick={() => setShowUnitForm(true)}
                                className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white mt-4 sm:mt-0"
                            >
                                <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                </svg>
                                <span className="max-xs:sr-only">Tạo Bài Mới</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            {/* Units List */}
                            <div className="col-span-12 md:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                                <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">Danh Sách Bài</h2>
                                </header>
                                <div className="p-3">
                                    {loading ? (
                                        <div className="text-center py-8 text-gray-500">Đang tải...</div>
                                    ) : units.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">Chưa có bài nào</div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                            {units.map(unit => (
                                                <li
                                                    key={unit.unit_id}
                                                    onClick={() => setSelectedUnit(unit)}
                                                    className={`flex justify-between items-center py-3 px-3 rounded-lg cursor-pointer transition-colors ${selectedUnit?.unit_id === unit.unit_id
                                                        ? 'bg-gray-100 dark:bg-gray-700'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-100">{unit.name}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">{unit.word_count} từ</span>
                                                            {unit.important_count > 0 && (
                                                                <span className="flex items-center gap-1 text-xs text-amber-500">
                                                                    <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                                                    {unit.important_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingUnit(unit);
                                                                setUnitName(unit.name);
                                                                setUnitDescription(unit.description || '');
                                                            }}
                                                            className="text-gray-400 hover:text-blue-500"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteUnit(unit.unit_id);
                                                            }}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Word Editor */}
                            <div className="col-span-12 md:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                                <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                                        {selectedUnit ? selectedUnit.name : 'Chọn một bài'}
                                    </h2>
                                </header>
                                <div className="p-5">
                                    {selectedUnit ? (
                                        <>
                                            {/* Existing Words */}
                                            {unitWords.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Từ đã thêm ({unitWords.length})</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {unitWords.map(word => (
                                                            <span
                                                                key={word.word_id}
                                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${word.is_important
                                                                    ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-gray-800 dark:text-gray-200'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                                    }`}
                                                            >
                                                                <button
                                                                    onClick={() => handleToggleImportant(word.word_id, word.is_important)}
                                                                    className={`p-0.5 rounded transition-colors ${word.is_important
                                                                        ? 'text-amber-500 hover:text-amber-600'
                                                                        : 'text-gray-300 hover:text-amber-400'
                                                                        }`}
                                                                    title={word.is_important ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}
                                                                >
                                                                    <svg className={`w-3.5 h-3.5 ${word.is_important ? 'fill-amber-400' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                </button>
                                                                {word.word}
                                                                <button
                                                                    onClick={() => handleDeleteWord(word.word_id)}
                                                                    className="ml-1 text-gray-400 hover:text-red-500"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Word Input Fields */}
                                            <div className="mb-4">
                                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thêm từ mới</h3>
                                                <div className="grid gap-3">
                                                    {currentPageInputs.map((value, idx) => {
                                                        const actualIdx = (wordsPage - 1) * WORDS_PER_PAGE + idx;
                                                        return (
                                                            <input
                                                                key={actualIdx}
                                                                type="text"
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const newInputs = [...wordInputs];
                                                                    newInputs[actualIdx] = e.target.value;
                                                                    setWordInputs(newInputs);
                                                                }}
                                                                placeholder={`Từ ${actualIdx + 1}`}
                                                                className="form-input w-full"
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Pagination */}
                                            {totalWordsPages > 1 && (
                                                <div className="flex items-center justify-center gap-2 mb-4">
                                                    <button
                                                        onClick={() => setWordsPage(p => Math.max(1, p - 1))}
                                                        disabled={wordsPage === 1}
                                                        className="btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 disabled:opacity-50"
                                                    >
                                                        ←
                                                    </button>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Trang {wordsPage} / {totalWordsPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setWordsPage(p => Math.min(totalWordsPages, p + 1))}
                                                        disabled={wordsPage === totalWordsPages}
                                                        className="btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 disabled:opacity-50"
                                                    >
                                                        →
                                                    </button>
                                                </div>
                                            )}

                                            {/* Save */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleAddWords}
                                                    disabled={saving}
                                                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white flex-1 disabled:opacity-50"
                                                >
                                                    {saving ? 'Đang lưu...' : 'Lưu từ'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-16 text-gray-500">
                                            Chọn một bài để thêm từ vựng
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Create/Edit Unit Modal */}
            {(showUnitForm || editingUnit) && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            {editingUnit ? 'Chỉnh sửa bài' : 'Tạo bài mới'}
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={unitName}
                                onChange={(e) => setUnitName(e.target.value)}
                                placeholder="Tên bài (VD: Unit 1 - Vocabulary)"
                                className="form-input w-full"
                            />
                            <textarea
                                value={unitDescription}
                                onChange={(e) => setUnitDescription(e.target.value)}
                                placeholder="Mô tả (tùy chọn)"
                                rows={3}
                                className="form-textarea w-full"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUnitForm(false);
                                    setEditingUnit(null);
                                    setUnitName('');
                                    setUnitDescription('');
                                }}
                                className="btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 flex-1"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={editingUnit ? handleUpdateUnit : handleCreateUnit}
                                className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white flex-1"
                            >
                                {editingUnit ? 'Cập nhật' : 'Tạo bài'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DictationManagement;
