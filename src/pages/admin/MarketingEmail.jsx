import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';

const MarketingEmail = () => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSendClick = () => {
        if (!subject.trim() || !content.trim()) {
            setStatusMessage({ type: 'error', text: 'Please fill in both subject and content.' });
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmSend = async () => {
        setShowConfirm(false);
        setIsLoading(true);
        setStatusMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetchWithTimeout(`${API_BASE}/admin/marketing/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: subject,
                    html_content: content
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to send broadcast');
            }

            setStatusMessage({ 
                type: 'success', 
                text: `Broadcast started successfully! Target audience size: ${data.target_audience_size}`
            });
            setSubject('');
            setContent('');
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing Email Broadcast</h1>
                    <p className="text-gray-500 mt-1">Send marketing emails or project seedings to all users in the database.</p>
                </div>
            </div>

            {statusMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
                >
                    {statusMessage.type === 'error' ? <XCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                    <span>{statusMessage.text}</span>
                </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                            placeholder="e.g. Exciting New IELTS Projects Available!"
                        />
                    </div>

                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                            Email HTML Content
                        </label>
                        <p className="text-xs text-gray-500 mb-2">You can use standard HTML tags to format your email (e.g. &lt;b&gt;, &lt;h1&gt;, &lt;br&gt;, &lt;a href="..."&gt;).</p>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none font-mono text-sm"
                            placeholder="<h1>Hello!</h1><p>Check out our new seeding projects...</p>"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSendClick}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium rounded-xl transition-colors shadow-sm"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {isLoading ? 'Processing...' : 'Send Broadcast'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-amber-600 mb-4">
                                <AlertCircle className="w-8 h-8" />
                                <h3 className="text-xl font-bold text-gray-900">Confirm Broadcast</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                You are about to send this email to <strong>all valid users</strong> in the database. Are you sure you want to proceed? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSend}
                                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Yes, Send It
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MarketingEmail;
