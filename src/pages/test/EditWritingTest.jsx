import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ChevronRight, Home, FileText } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import '../../css/split.css';
import Split from 'react-split';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const EditWritingTest = () => {
    const TASK_TYPES = [
        { value: 'essay', label: 'Essay' },
        { value: 'report', label: 'Graph' },
        { value: 'letter', label: 'Table' }
    ];
    const [apiKey, setApiKey] = useState('');
    const { examId } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);

    const [testData, setTestData] = useState({
        title: '',
        section: {
            duration: 0,
            total_marks: 0
        },
        tasks: []
    });
     const fetchApiKey = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/action/update-keys`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error('Fetch API key error:', errorMessage);
                throw new Error('Failed to fetch API key');
            }

            const keys = await response.json();
            const listeningKey = keys.find(key => key.type === 'writing' && key.is_active);
            if (listeningKey) {
                setApiKey(listeningKey.key);
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
            toast.error('Failed to fetch API key');
        }
    };
    // Add useEffect to fetch the API key when component mounts
    useEffect(() => {
        fetchApiKey();
    }, []);
    const fetchTestDetails = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/writing-test/${examId}/details`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            const data = await response.json();
            
            // Ensure we set default values for all controlled inputs
            setTestData({
                title: data.title || '',
                section: data.section || { duration: 0, total_marks: 0 },
                tasks: data.tasks || []
            });
            
            // Load first task data if available
            if (data.tasks && data.tasks.length > 0) {
                const task = data.tasks[0];
                setCurrentPart({
                    part_number: task.part_number || 1,
                    task_type: task.task_type || 'essay',
                    title: task.title || '',
                    instructions: task.instructions || '',
                    word_limit: task.word_limit || 250,
                    total_marks: task.total_marks || 20.0,
                    duration: task.duration || 60,
                    is_forecast: task.is_forecast || false
                });
                setEditorContent(task.instructions || '');
            }
        } catch (error) {
            toast.error('Failed to fetch test details');
            console.error('Error fetching test details:', error);
        }
    };

    const [currentPart, setCurrentPart] = useState({
        part_number: 1,
        task_type: 'essay',
        title: '',
        instructions: '',
        word_limit: 250,
        total_marks: 20.0,
        duration: 60,
        is_forecast: false
    });

    const [editorContent, setEditorContent] = useState('');

    useEffect(() => {
        fetchTestDetails();
    }, [examId]);

   

    const handleEditorChange = (content) => {
        setEditorContent(content);
        setCurrentPart({
            ...currentPart,
            instructions: content
        });
    };

    const handleUpdateTest = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/writing-test/${examId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                toast.success('Test updated successfully!');
            } else {
                toast.error('Failed to update test');
            }
        } catch (error) {
            toast.error('Failed to update test');
            console.error('Error updating test:', error);
        }
    };

    const handleUpdatePart = async () => {
        if (!currentPart.instructions.trim()) {
            toast.error('Please input instructions');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/writing-test/${examId}/part/${currentPart.part_number}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(currentPart)
            });

            if (response.ok) {
                toast.success(`Part ${currentPart.part_number} updated successfully!`);
                if (currentPart.part_number === 1 && testData.tasks && testData.tasks.length > 1) {
                const task2 = testData.tasks[1];
                setCurrentPart({
                    part_number: task2.part_number,
                    task_type: task2.task_type,
                    title: task2.title || '',
                    instructions: task2.instructions,
                    word_limit: task2.word_limit,
                    total_marks: task2.total_marks,
                    duration: task2.duration,
                    is_forecast: task2.is_forecast || false
                });
                setEditorContent(task2.instructions);
            } else {
                navigate('/manage_test');
            }
            }
        } catch (error) {
            toast.error('Failed to update part');
            console.error('Error updating part:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center space-x-2 py-4">
                        <Link to="/" className="text-gray-400 hover:text-violet-600">
                            <Home size={20} />
                        </Link>
                        <ChevronRight className="text-gray-400" size={20} />
                        <span className="text-violet-600">Edit Writing Test</span>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="space-y-6">
                        <input
                            type="text"
                            value={testData.title}
                            onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border"
                            placeholder="Test title"
                        />
                        <button
                            onClick={handleUpdateTest}
                            className="w-full bg-violet-600 text-white py-2 rounded-lg"
                        >
                            Update Test Title
                        </button>
                    </div>
                </div>

                <Split
                    className="flex h-[calc(100vh-64px)]"
                    sizes={[60, 40]}
                    minSize={300}
                >
                    <div className="h-full">
                        <div className="bg-white p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">
                                    Part {currentPart.part_number}
                                </h2>
                                <select
                                    value={currentPart.task_type}
                                    onChange={(e) => setCurrentPart({
                                        ...currentPart,
                                        task_type: e.target.value
                                    })}
                                    className="px-3 py-2 rounded border"
                                >
                                    {TASK_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    value={currentPart.title}
                                    onChange={(e) => setCurrentPart({ ...currentPart, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded border"
                                    placeholder="Part title"
                                />
                                <label className="inline-flex items-center text-sm gap-2">
                                    <input
                                        type="checkbox"
                                        checked={currentPart.is_forecast}
                                        onChange={(e) => setCurrentPart({ ...currentPart, is_forecast: e.target.checked })}
                                    />
                                    <span>Mark as forecast</span>
                                </label>
                            </div>
                        </div>

                        <div className="h-[calc(100vh-180px)]">
                                                   <Editor
                                apiKey="tpb91vt7byjttii2osy6j9t9j1ygoualadzn0g6o8qu4gyzg"
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={editorContent}
                                init={{
                                    height: '100%',
                                    menubar: false,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                    ],
                                    toolbar: 'image | undo redo | blocks | ' +
                                        'fontsize | ' +
                                        'bold italic | ' +
                                        'alignleft aligncenter alignright alignjustify | ' +
                                        'bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                    fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 36pt 48pt 72pt',
                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px } .img-medium { width: 500px; height: auto; }',
                                    // Image settings
                                    image_title: false,
                                    image_description: false,
                                    image_dimensions: true,
                                    image_class_list: [
                                        {title: 'Medium', value: 'img-medium'}
                                    ],
                                    file_picker_types: 'image',
                                    images_file_types: 'jpg,jpeg,png',
                                    image_advtab: false,
                                    file_picker_callback: function(cb, value, meta) {
                                        if (meta.filetype === 'image') {
                                            const input = document.createElement('input');
                                            input.setAttribute('type', 'file');
                                            input.setAttribute('accept', 'image/*');
                                        
                                            input.addEventListener('change', (e) => {
                                                const file = e.target.files[0];
                                                const reader = new FileReader();
                                                reader.readAsDataURL(file);
                                                reader.onload = () => {
                                                    cb(reader.result, { 
                                                        title: file.name,
                                                        class: 'img-medium'
                                                    });
                                                };
                                            });
                                        
                                            input.click();
                                        }
                                    }
                                }}
                                onEditorChange={handleEditorChange}
                            />
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Word Limit</label>
                                <input
                                    type="number"
                                    value={currentPart.word_limit}
                                    onChange={(e) => setCurrentPart({
                                        ...currentPart,
                                        word_limit: parseInt(e.target.value)
                                    })}
                                    className="mt-1 w-full px-3 py-2 rounded border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                                <input
                                    type="number"
                                    value={currentPart.total_marks}
                                    onChange={(e) => setCurrentPart({
                                        ...currentPart,
                                        total_marks: parseFloat(e.target.value)
                                    })}
                                    className="mt-1 w-full px-3 py-2 rounded border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={currentPart.duration}
                                    onChange={(e) => setCurrentPart({
                                        ...currentPart,
                                        duration: parseInt(e.target.value)
                                    })}
                                    className="mt-1 w-full px-3 py-2 rounded border"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleUpdatePart}
                                className="px-6 py-2 bg-violet-600 text-white rounded-lg"
                            >
                                {currentPart.part_number === 2 ? 'Finish' : 'Next Part'}
                            </button>
                        </div>
                    </div>
                </Split>
            </div>
        </div>
    );
};

export default EditWritingTest;
