import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Home, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import API_BASE from '../../config/api';

const EditSpeakingTest = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [partType, setPartType] = useState('part1');

    const toAbsoluteUrl = (u) => (u && u.startsWith('/')) ? `${API_BASE}${u}` : u;
    const [pdfUrl, setPdfUrl] = useState('');
    const [newPdf, setNewPdf] = useState(null);

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/admin/speaking/materials/${topicId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                if (!res.ok) throw new Error('Failed to load speaking material');
                const data = await res.json();
                setTitle(data.title || '');
                setPartType(data.part_type || 'part1');
                setPdfUrl(toAbsoluteUrl(data.pdf_url) || '');
            } catch (e) {
                console.error(e);
                toast.error('Failed to load speaking material');
            } finally {
                setLoading(false);
            }
        };
        fetchMaterial();
    }, [topicId]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (newPdf && newPdf.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('part_type', partType);
            if (newPdf) formData.append('pdf_file', newPdf);
            const res = await fetch(`${API_BASE}/admin/speaking/materials/${topicId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                body: formData
            });
            if (!res.ok) throw new Error('Failed to update speaking material');
            toast.success('Updated');
            navigate('/manage_speaking_topic');
        } catch (e) {
            console.error(e);
            toast.error('Failed to update speaking material');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Toaster position="top-right" />
            <nav className="bg-white border-b border-gray-200 flex-none">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center space-x-2 py-4">
                        <Link to="/" className="text-gray-400 hover:text-violet-600">
                            <Home size={20} />
                        </Link>
                        <ChevronRight className="text-gray-400" size={20} />
                        <Link to="/manage_speaking_topic" className="text-gray-400 hover:text-violet-600">
                            Manage Speaking Forecast
                        </Link>
                        <ChevronRight className="text-gray-400" size={20} />
                        <span className="text-violet-600">Edit Speaking Forecast Material</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="bg-white rounded-xl shadow p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading material...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">Edit Speaking Forecast Material</h2>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => navigate('/manage_speaking_topic')}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                        <span>Back</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Save size={18} />
                                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="Enter title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700">
                                        Speaking Forecast
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current PDF</label>
                                    {pdfUrl ? (
                                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">View current file</a>
                                    ) : (
                                        <p className="text-gray-500">No file uploaded</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Replace PDF</label>
                                    <input type="file" accept="application/pdf" onChange={(e) => setNewPdf(e.target.files[0] || null)} />
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditSpeakingTest;
