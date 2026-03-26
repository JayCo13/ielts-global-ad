import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Save, Headphones, BookOpen, Loader2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import API_BASE from '../../config/api';

const ManagePartTitles = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTest, setExpandedTest] = useState(null);
    const [descriptions, setDescriptions] = useState({});
    const [saving, setSaving] = useState(null);
    const [loadingDescriptions, setLoadingDescriptions] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'listening', 'reading'
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const token = localStorage.getItem('access_token');

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/dashboard/exams?skip=0&limit=10000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Filter to only listening and reading tests
            const relevantTests = (Array.isArray(data) ? data : []).filter(t => {
                const types = Array.isArray(t.section_types) ? t.section_types : [];
                return types.includes('listening') || types.includes('reading');
            });
            setTests(relevantTests);
        } catch (error) {
            console.error('Error fetching tests:', error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const getTestType = (test) => {
        const types = Array.isArray(test.section_types) ? test.section_types : [];
        if (types.includes('listening')) return 'listening';
        if (types.includes('reading')) return 'reading';
        return 'unknown';
    };

    const getPartCount = (type) => type === 'listening' ? 4 : 3;

    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const fetchDescriptions = async (examId, type) => {
        setLoadingDescriptions(examId);
        try {
            const endpoint = type === 'listening'
                ? `${API_BASE}/admin/listening-test/${examId}/part-titles`
                : `${API_BASE}/admin/reading/reading-test/${examId}/descriptions`;

            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const partCount = getPartCount(type);
                const parts = {};
                for (let i = 1; i <= partCount; i++) {
                    if (type === 'listening') {
                        parts[i] = stripHtml(data[`part${i}_title`] || '');
                    } else {
                        parts[i] = stripHtml(data[`part${i}_description`] || '');
                    }
                }
                setDescriptions(prev => ({
                    ...prev,
                    [examId]: { ...parts, mainDescription: data.description || '' }
                }));
            } else {
                toast.error('Failed to load titles');
            }
        } catch (error) {
            console.error('Error fetching titles:', error);
            toast.error('Failed to load titles');
        } finally {
            setLoadingDescriptions(null);
        }
    };

    const handleToggleExpand = (examId, type) => {
        if (expandedTest === examId) {
            setExpandedTest(null);
        } else {
            setExpandedTest(examId);
            if (!descriptions[examId]) {
                fetchDescriptions(examId, type);
            }
        }
    };

    const handleDescriptionChange = (examId, partNum, value) => {
        setDescriptions(prev => ({
            ...prev,
            [examId]: {
                ...prev[examId],
                [partNum]: value
            }
        }));
    };

    const handleSave = async (examId, type) => {
        setSaving(examId);
        try {
            const partCount = getPartCount(type);
            const body = {};
            if (type === 'listening') {
                for (let i = 1; i <= partCount; i++) {
                    body[`part${i}_title`] = descriptions[examId]?.[i] || '';
                }
            } else {
                for (let i = 1; i <= partCount; i++) {
                    body[`part${i}_description`] = descriptions[examId]?.[i] || '';
                }
            }

            const endpoint = type === 'listening'
                ? `${API_BASE}/admin/listening-test/${examId}/part-titles`
                : `${API_BASE}/admin/reading/reading-test/${examId}/descriptions`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success('Part titles updated successfully!', {
                    style: { background: '#10B981', color: '#FFFFFF' }
                });
            } else {
                const data = await response.json();
                toast.error(data.detail || 'Failed to update', {
                    style: { background: '#EF4444', color: '#FFFFFF' }
                });
            }
        } catch (error) {
            console.error('Error saving titles:', error);
            toast.error('Failed to save titles');
        } finally {
            setSaving(null);
        }
    };

    const filteredTests = tests
        .filter(t => {
            if (filter === 'all') return true;
            return getTestType(t) === filter;
        })
        .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

    const totalPages = Math.max(1, Math.ceil(filteredTests.length / ITEMS_PER_PAGE));
    const paginatedTests = filteredTests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    // Generate visible page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // max page buttons to show
        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 3) { start = 2; end = Math.min(maxVisible, totalPages - 1); }
            if (currentPage >= totalPages - 2) { start = Math.max(2, totalPages - maxVisible + 1); end = totalPages - 1; }
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <Toaster position="top-right" />

            {/* Breadcrumb */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <Link to="/" className="text-gray-400 hover:text-violet-600 transition-colors">
                                <Home size={20} />
                            </Link>
                            <ChevronRight size={20} className="text-gray-400" />
                            <span className="text-violet-600 dark:text-violet-400 font-medium">
                                Quản Lý Tiêu Đề Part
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Quản Lý Tiêu Đề Part
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Thêm và chỉnh sửa tiêu đề cho từng part của bài thi Listening và Reading
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên bài thi..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Loại bài thi
                        </label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Tất cả</option>
                            <option value="listening">Listening</option>
                            <option value="reading">Reading</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tổng bài thi</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{filteredTests.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Headphones className="w-4 h-4 mr-1" /> Listening
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {filteredTests.filter(t => getTestType(t) === 'listening').length}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <BookOpen className="w-4 h-4 mr-1" /> Reading
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {filteredTests.filter(t => getTestType(t) === 'reading').length}
                    </div>
                </div>
            </div>

            {/* Tests List */}
            <div className="space-y-4">
                {paginatedTests.map(test => {
                    const type = getTestType(test);
                    const partCount = getPartCount(type);
                    const isExpanded = expandedTest === test.exam_id;
                    const isLoadingThis = loadingDescriptions === test.exam_id;
                    const isSavingThis = saving === test.exam_id;

                    return (
                        <div
                            key={test.exam_id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200"
                        >
                            {/* Test Header */}
                            <button
                                onClick={() => handleToggleExpand(test.exam_id, type)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${type === 'listening'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                        : 'bg-blue-100 dark:bg-blue-900/30'
                                        }`}>
                                        {type === 'listening'
                                            ? <Headphones className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            : <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        }
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                            {test.title}
                                        </h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type === 'listening'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {type === 'listening' ? 'Listening' : 'Reading'} · {partCount} Parts
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${test.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {test.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded
                                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                    : <ChevronDown className="w-5 h-5 text-gray-400" />
                                }
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                                    {isLoadingThis ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                                            <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-4 space-y-4">
                                                {Array.from({ length: partCount }, (_, i) => i + 1).map(partNum => (
                                                    <div key={partNum} className="group">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mr-2 ${type === 'listening'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                                }`}>
                                                                Part {partNum}
                                                            </span>
                                                            Tiêu đề
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={descriptions[test.exam_id]?.[partNum] || ''}
                                                            onChange={(e) => handleDescriptionChange(test.exam_id, partNum, e.target.value)}
                                                            placeholder={`Nhập tiêu đề cho Part ${partNum}...`}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:border-violet-300"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={() => handleSave(test.exam_id, type)}
                                                    disabled={isSavingThis}
                                                    className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 ${isSavingThis
                                                        ? 'bg-violet-400 cursor-not-allowed'
                                                        : 'bg-violet-600 hover:bg-violet-700 shadow-sm hover:shadow-md'
                                                        }`}
                                                >
                                                    {isSavingThis ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Đang lưu...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            Lưu tiêu đề
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredTests.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Không tìm thấy bài thi nào</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hiển thị <span className="font-semibold text-gray-700 dark:text-gray-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-semibold text-gray-700 dark:text-gray-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTests.length)}</span> / <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredTests.length}</span> bài thi
                        </p>
                        <div className="flex items-center gap-1">
                            {/* First */}
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Trang đầu"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            {/* Prev */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Trang trước"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page numbers */}
                            {getPageNumbers().map((page, idx) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                            ? 'bg-violet-600 text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            {/* Next */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Trang sau"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {/* Last */}
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Trang cuối"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePartTitles;
