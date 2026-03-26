import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const CreateSpeakingTest = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [partType, setPartType] = useState('part1');
    const [pdfFile, setPdfFile] = useState(null);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!pdfFile) {
            toast.error('Please upload a PDF file');
            return;
        }
        if (pdfFile.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('part_type', partType);
            formData.append('pdf_file', pdfFile);

            const response = await fetch(`${API_BASE}/admin/speaking/materials`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Failed to create speaking material');
            }

            toast.success('Speaking material created');
            navigate('/manage_speaking_topic');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create speaking material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ToastContainer position="top-right" />
            <nav className="bg-white border-b border-gray-200 flex-none">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center space-x-2 py-4">
                        <Link to="/" className="text-gray-400 hover:text-violet-600">
                            <Home size={20} />
                        </Link>
                        <ChevronRight className="text-gray-400" size={20} />
                        <span className="text-violet-600">Create Speaking Forecast Material</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 overflow-hidden">
                <div className="h-full max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="space-y-4">
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
                                <input type="hidden" value="part1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF *</label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                                    className="w-full"
                                />
                                {pdfFile && (
                                    <p className="text-sm text-gray-500 mt-1">Selected: {pdfFile.name}</p>
                                )}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`w-full bg-violet-600 text-white py-2 rounded-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSpeakingTest;
