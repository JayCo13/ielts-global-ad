import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ChevronRight, Home, Headphones, FileText, Info } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { ToastContainer, toast } from 'react-toastify';
import TestDetailsDialog from '../../components/TestDetailsDialog';
import '../../css/split.css';
import Split from 'react-split';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-grid-layout/css/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import DescriptionDialog from '../../components/dialogs/DescriptionDialog';
import RichTextEditor from '../../components/editor/RichTextEditor';
import API_BASE from '../../config/api';

const EditListeningTest = () => {
    const QUESTION_TYPES = [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'three_options', label: 'Three Options' },
        { value: 'two_options', label: 'Two Options' },
        { value: 'fill_in_blank', label: 'Fill in the Blank' },
        { value: 'map', label: 'Map' },
        { value: 'matching', label: 'Matching' },
        { value: 'true_false', label: 'True/False' }
    ];
    const getInitialQuestionState = (type = 'multiple_choice') => {
        const baseQuestion = {
            question_type: type,
            question_text: '',
            correct_answer: '',
            marks: 1
        };

        switch (type) {
            case 'multiple_choice':
                return {
                    ...baseQuestion,
                    options: Array(4).fill({ option_text: '', is_correct: false })
                };
            case 'three_options':
                return {
                    ...baseQuestion,
                    options: Array(3).fill({ option_text: '', is_correct: false })
                };
            case 'two_options':
                return {
                    ...baseQuestion,
                    options: Array(2).fill({ option_text: '', is_correct: false })
                };
            case 'matching':
                return {
                    ...baseQuestion,
                    matching_pairs: []
                };
            case 'fill_in_blank':
                return {
                    ...baseQuestion,
                    blanks: []
                };
            case 'map':
                return {
                    ...baseQuestion,
                    is_map: true,
                    options: Array(8).fill({ option_text: '', is_correct: false })
                };
            case 'true_false':
                return {
                    ...baseQuestion,
                    correct_answer: 'true'
                };
            default:
                return baseQuestion;
        }
    };

    const { examId } = useParams();

    const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editorContent, setEditorContent] = useState('');
    const [questionTypeCollapsed, setQuestionTypeCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState({
        title: '',
        duration: 2400,
        total_marks: 40,
        is_active: true
    });

    const [currentPart, setCurrentPart] = useState({
        audioFile: null,
        transcript: '',
        section_id: null,
        audio_filename: '',
        description: '',
        questions: Array(10).fill(null).map(() => getInitialQuestionState())
    });

    const [audioChanged, setAudioChanged] = useState(false);
    useEffect(() => {
        if (!examId) {
            console.error('No exam ID provided');
            navigate('/manage_test');
            toast.error('No exam ID provided. Redirecting back to test management.');
            return;
        }
        fetchTestData();
    }, [examId, navigate]);

    const handlePartDescriptionUpdate = async (newDescription) => {
        try {
            // Create the descriptions data object with the appropriate part description
            const descriptionsData = {
                description: null, // We're only updating a specific part description
                part1_description: currentStep === 1 ? newDescription : null,
                part2_description: currentStep === 2 ? newDescription : null,
                part3_description: currentStep === 3 ? newDescription : null,
                part4_description: currentStep === 4 ? newDescription : null
            };

            const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/descriptions`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(descriptionsData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update part description');
            }

            const data = await response.json();
            setCurrentPart({
                ...currentPart,
                description: newDescription
            });
            toast.success(`Part ${currentStep} description updated successfully`);
            setShowDescriptionDialog(false);
        } catch (error) {
            toast.error(error.message);
            console.error('Error updating part description:', error);
        }
    };

    const handleTitleUpdate = async (newTitle) => {
        try {
            const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/title`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: newTitle
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update title');
            }

            const data = await response.json();
            setTestData({
                ...testData,
                title: data.title
            });
            toast.success('Test title updated successfully');
        } catch (error) {
            toast.error(error.message);
            console.error('Error updating test title:', error);
        }
    };

    const fetchTestData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/listening-test/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch test data');
            }

            const data = await response.json();
            setTestData({
                title: data.title,
                description: data.description || '',
                duration: data.duration || 2400,
                total_marks: data.total_marks || 40,
                is_active: data.is_active
            });

            // Set current step based on the part we want to edit
            setCurrentStep(1);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch test data');
            console.error('Error fetching test data:', error);
            setLoading(false);
        }
    };

    const fetchPartData = async (partNumber) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/part/${partNumber}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch part ${partNumber} data`);
            }

            const data = await response.json();

            // Format the questions data
            const formattedQuestions = data.questions.map(q => {
                const baseQuestion = {
                    question_id: q.question_id,
                    question_type: q.question_type,
                    question_text: q.question_text,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation || '',
                    locate: q.locate || '',
                    marks: q.marks
                };

                if (q.options && q.options.length > 0) {
                    baseQuestion.options = q.options;
                }

                return baseQuestion;
            });

            setCurrentPart({
                audioFile: null,
                transcript: data.transcript || '',
                section_id: data.section_id,
                audio_filename: data.audio_filename || '',
                description: data.description || '',
                questions: formattedQuestions.length > 0 ? formattedQuestions : Array(10).fill(null).map(() => getInitialQuestionState())
            });

            setEditorContent(data.transcript || '');
            setAudioChanged(false);
            setLoading(false);
        } catch (error) {
            toast.error(`Failed to fetch part ${partNumber} data`);
            console.error(`Error fetching part ${partNumber} data:`, error);
            setLoading(false);
        }
    };

    const handleEditorChange = (content) => {
        setEditorContent(content);
        setCurrentPart({
            ...currentPart,
            transcript: content
        });
    };

    const handleQuestionUpdate = (index, field, value) => {
        const updatedQuestions = [...currentPart.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            [field]: value
        };
        setCurrentPart({
            ...currentPart,
            questions: updatedQuestions
        });
    };

    const handleQuestionOptionUpdate = (questionIndex, optionIndex, field, value) => {
        const updatedQuestions = [...currentPart.questions];
        const updatedOptions = [...updatedQuestions[questionIndex].options];

        // If updating is_correct, set all other options to false
        if (field === 'is_correct' && value === true) {
            updatedOptions.forEach((opt, idx) => {
                updatedOptions[idx] = { ...opt, is_correct: idx === optionIndex };
            });
        } else {
            updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
        }

        updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            options: updatedOptions
        };

        setCurrentPart({
            ...currentPart,
            questions: updatedQuestions
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCurrentPart({
                ...currentPart,
                audioFile: file
            });
            setAudioChanged(true);
        }
    };

    const validatePart = () => {
        // Validate question types
        const hasAllQuestionTypes = currentPart.questions.every(q => q && q.question_type);
        if (!hasAllQuestionTypes) {
            toast.error('Please select question types for all questions');
            return false;
        }

        // Validate transcript
        if (!currentPart.transcript.trim()) {
            toast.error('Please enter a transcript');
            return false;
        }

        // Validate correct answers
        const hasAllAnswers = currentPart.questions.every(q => q && q.correct_answer && q.correct_answer.trim());
        if (!hasAllAnswers) {
            toast.error('Please input all correct answers');
            return false;
        }

        return true;
    };

    const handleUpdatePart = async (partNumber) => {
        if (!validatePart()) return;

        try {
            setLoading(true);

            // Format questions before sending to database
            const formattedQuestions = currentPart.questions.map(question => {
                let formattedQuestion = { ...question };

                // Handle map questions
                if (question.question_type === 'map') {
                    formattedQuestion = {
                        ...question,
                        question_type: 'map',
                        options: question.options.filter(opt => opt.option_text.trim() !== '')
                    };
                }
                // Handle multiple choice with specific number of options
                else if (question.options) {
                    if (question.options.length === 3) {
                        formattedQuestion.question_type = 'three_options';
                    } else if (question.options.length === 2) {
                        formattedQuestion.question_type = 'two_options';
                    }
                }

                return formattedQuestion;
            });

            const formData = new FormData();

            // If audio file has changed, use update-with-audio endpoint
            if (audioChanged && currentPart.audioFile) {
                formData.append('audio_file', currentPart.audioFile);
                formData.append('transcript', editorContent);
                formData.append('questions_json', JSON.stringify(formattedQuestions));

                const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/part/${partNumber}/update-with-audio`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Failed to update part ${partNumber}`);
                }
            } else {
                // Use update endpoint without audio
                formData.append('transcript', editorContent);
                formData.append('questions_json', JSON.stringify(formattedQuestions));

                const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/part/${partNumber}/update`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Failed to update part ${partNumber}`);
                }
            }

            toast.success(`Part ${partNumber} updated successfully!`);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Navigate to next part or finish
            if (partNumber < 4) {
                setCurrentStep(partNumber + 1);
                fetchPartData(partNumber + 1);
            } else {
                // After Part 4 is saved, navigate to homepage
                toast.success('Test updated successfully!');
                navigate('/');
            }

            setLoading(false);
        } catch (error) {
            toast.error(`Failed to update part ${partNumber}`);
            console.error(`Error updating part ${partNumber}:`, error);
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, label: 'Part 1' },
        { number: 2, label: 'Part 2' },
        { number: 3, label: 'Part 3' },
        { number: 4, label: 'Part 4' }
    ];

    // Fetch part data when current step changes
    useEffect(() => {
        if (examId && currentStep >= 1 && currentStep <= 4) {
            fetchPartData(currentStep);
        }
    }, [currentStep]);

    if (loading && currentStep === 1) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading test data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
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

            {/* Floating Buttons */}
            <div className="fixed top-12 right-4 z-50 flex flex-col space-y-2">
                <button
                    onClick={() => setShowDetailsDialog(true)}
                    className="p-2 bg-violet-600 rounded-full shadow-lg text-white hover:bg-violet-700 hover:shadow-xl transition-all duration-200 animate-ring"
                    title="Test Details"
                >
                    <Info size={20} />
                </button>
                <button
                    onClick={() => setShowDescriptionDialog(true)}
                    className="p-2 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
                    title={`Edit Part ${currentStep} Description`}
                >
                    <FileText size={20} />
                </button>
            </div>

            {/* Test Details Dialog */}
            <TestDetailsDialog
                isOpen={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                testData={testData}
                examId={examId}
                currentStep={currentStep}
            />

            {/* Description Dialog */}
            <DescriptionDialog
                isOpen={showDescriptionDialog}
                onClose={() => setShowDescriptionDialog(false)}
                currentDescription={currentPart.description}
                onUpdate={handlePartDescriptionUpdate}
                title={`Part ${currentStep} Description`}
            />

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <Link to="/" className="text-gray-400 hover:text-violet-600">
                                <Home size={20} />
                            </Link>
                            <ChevronRight className="text-gray-400" size={20} />
                            <div className="flex items-center">
                                Chỉnh sửa tiêu đề:
                                <input
                                    type="text"
                                    value={testData.title}
                                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                    onBlur={(e) => handleTitleUpdate(e.target.value)}
                                    className="text-black bg-transparent border-b border-black hover:border-violet-200 focus:border-violet-600 focus:outline-none px-2 py-1 rounded font-bold"
                                />

                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center space-x-4">
                                {steps.map((step) => (
                                    <div
                                        key={step.number}
                                        className={`flex items-center ${currentStep === step.number
                                            ? 'text-violet-600'
                                            : currentStep > step.number
                                                ? 'text-green-500'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                                            ${currentStep === step.number
                                                ? 'border-violet-600 bg-violet-50'
                                                : currentStep > step.number
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {currentStep > step.number ? '✓' : step.number}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">{step.label}</span>
                                        {step.number < steps.length && (
                                            <ChevronRight className="ml-4" size={16} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <Split
                className="flex h-[calc(100vh-64px)] bg-gray-50"
                sizes={[50, 50]}
                minSize={300}
                gutterSize={8}
                gutterStyle={() => ({
                    backgroundColor: '#e5e7eb',
                    cursor: 'col-resize'
                })}
            >
                <div className="h-full flex flex-col overflow-hidden">

                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-700 p-4 bg-white border-b flex items-center">
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">1</span>
                            Transcript
                        </h3>
                        <div className="h-[calc(100%-60px)]">
                            <Editor
                                apiKey="aur4xkxqvptcthxzotku6rs1xpcp9tz3sxcuo6664k4s185h"
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={editorContent}
                                onEditorChange={handleEditorChange}
                                init={{
                                    height: '100%',
                                    menubar: false,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',

                                    ],
                                    toolbar: [
                                        'undo redo | blocks | fontsize | bold italic | alignleft aligncenter alignright alignjustify',
                                        'bullist numlist | outdent indent | checkbox radio textfield | image sidebyside | ieltstable | dragdrop | reformat | separator',
                                        'removeformat | help'
                                    ],
                                    fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 36pt',
                                    images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            resolve(reader.result);
                                        };
                                        reader.onerror = () => {
                                            reject('Failed to read file');
                                        };
                                        reader.readAsDataURL(blobInfo.blob());
                                    }),
                                    setup: (editor) => {
                                        // Add re-format button
                                        editor.ui.registry.addButton('reformat', {
                                            text: 'Re-format',
                                            tooltip: 'Re-format selected text to Calibri 12pt',
                                            onAction: () => {
                                                editor.execCommand('fontName', false, 'Calibri');
                                                editor.execCommand('fontSize', false, '12pt');
                                            }
                                        });
                                        // Add question separator button
                                        editor.ui.registry.addButton('separator', {
                                            text: 'Add Separator',
                                            tooltip: 'Insert question separator',
                                            onAction: () => {
                                                editor.insertContent('<div class="question-separator"></div>');
                                            }
                                        });
                                        // Enhanced checkbox button
                                        editor.ui.registry.addButton('checkbox', {
                                            text: '☐ Checkbox',
                                            tooltip: 'Insert checkbox',
                                            onAction: () => {
                                                editor.insertContent('<input type="checkbox" class="ielts-checkbox" /> ');
                                            }
                                        });
                                        editor.ui.registry.addButton('ieltstable', {
                                            text: 'Ielts table',
                                            tooltip: 'Insert Ielts tab',
                                            onAction: () => {
                                                editor.windowManager.open({
                                                    title: 'Insert IELTS Table',
                                                    body: {
                                                        type: 'panel',
                                                        items: [
                                                            {
                                                                type: 'input',
                                                                name: 'questionCount',
                                                                label: 'Number of Questions',
                                                                inputMode: 'numeric'
                                                            },
                                                            {
                                                                type: 'input',
                                                                name: 'answerCount',
                                                                label: 'Number of Answers per Question',
                                                                inputMode: 'numeric'
                                                            }
                                                        ]
                                                    },
                                                    buttons: [
                                                        {
                                                            type: 'cancel',
                                                            text: 'Close'
                                                        },
                                                        {
                                                            type: 'submit',
                                                            text: 'Insert',
                                                            primary: true
                                                        }
                                                    ],
                                                    onSubmit: (api) => {
                                                        const data = api.getData();
                                                        const questionCount = parseInt(data.questionCount) || 6;
                                                        const answerCount = parseInt(data.answerCount) || 4;

                                                        // Generate table HTML
                                                        let tableHtml = '<table style="width:100%; border-collapse: collapse; margin: 10px 0;">';

                                                        // Header row
                                                        tableHtml += '<tr><th style="border: 1px solid #ddd; padding: 8px;">Question</th>';
                                                        for (let i = 0; i < answerCount; i++) {
                                                            tableHtml += `<th style="border: 1px solid #ddd; padding: 8px;">${String.fromCharCode(65 + i)}</th>`;
                                                        }
                                                        tableHtml += '</tr>';

                                                        for (let i = 1; i <= questionCount; i++) {
                                                            const groupName = 'radiogroup_' + Math.floor(Math.random() * 10000); // Ensure unique group name for each question
                                                            tableHtml += '<tr>';
                                                            tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">${i} Enter your question here.</td>`;
                                                            for (let j = 0; j < answerCount; j++) {
                                                                tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            <input type="radio" name="${groupName}" value="${String.fromCharCode(65 + j)}" class="ielts-radio" style="margin: 0;">
        </td>`;
                                                            }
                                                            tableHtml += '</tr>';
                                                        }
                                                        // ... existing code ...
                                                        tableHtml += '</table>';

                                                        // Insert the table
                                                        editor.insertContent(tableHtml);
                                                        api.close();
                                                    }
                                                });
                                            }
                                        });
                                        // Enhanced radio button
                                        editor.ui.registry.addButton('radio', {
                                            text: '○ Radio',
                                            tooltip: 'Insert radio button',
                                            onAction: () => {
                                                const groupName = 'radiogroup_' + Math.floor(Math.random() * 10000);
                                                editor.insertContent(`<input type="radio" name="${groupName}" class="ielts-radio" /> `);
                                            }
                                        });
                                        editor.ui.registry.addButton('dragdrop', {
                                            text: 'Drag & Drop',
                                            onAction: () => {
                                                editor.windowManager.open({
                                                    title: 'Create Drag & Drop Question',
                                                    body: {
                                                        type: 'panel',
                                                        items: [
                                                            {
                                                                type: 'textarea',
                                                                name: 'article',
                                                                label: 'Article Text',
                                                                placeholder: 'Enter your article text. Use "..........." (dots) to indicate drop zones.'
                                                            },
                                                            {
                                                                type: 'textarea',
                                                                name: 'answers',
                                                                label: 'Answers (one per line)',
                                                                placeholder: 'Enter answers, one per line'
                                                            }
                                                        ]
                                                    },
                                                    buttons: [
                                                        {
                                                            type: 'cancel',
                                                            text: 'Close'
                                                        },
                                                        {
                                                            type: 'submit',
                                                            text: 'Insert',
                                                            primary: true
                                                        }
                                                    ],
                                                    onSubmit: (api) => {
                                                        const data = api.getData();
                                                        const answers = data.answers.split('\n').filter(answer => answer.trim());
                                                        let article = data.article;

                                                        // Replace dots with drop zones
                                                        let dropIndex = 0;
                                                        article = article.replace(/\.{3,}/g, (match) => {
                                                            dropIndex++;
                                                            return `<div class="ielts-drop-zone" data-index="${dropIndex}" contenteditable="false" style="display: inline-block; min-width: 100px; height: 24px; border: 2px dashed #ccc; background: #f0f0f0; margin: 0 4px;"></div>`;
                                                        });

                                                        // Create draggable answers
                                                        let answersHtml = '<div class="ielts-answers" style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; background: #f8f8f8;">';
                                                        answers.forEach((answer, index) => {
                                                            answersHtml += `<div class="ielts-drag-item" draggable="true" data-answer="${index + 1}" style="display: inline-block; padding: 4px 8px; margin: 4px; background: #fff; border: 1px solid #ddd; cursor: move;">${answer}</div>`;
                                                        });
                                                        answersHtml += '</div>';

                                                        // Insert the complete question
                                                        editor.insertContent(`
                                                                <div class="ielts-dragdrop-question" style="margin: 20px 0;">
                                                                    <div class="ielts-article">${article}</div>
                                                                    ${answersHtml}
                                                                </div>
                                                            `);

                                                        api.close();
                                                    }
                                                });
                                            }
                                        });
                                        // New text field button
                                        editor.ui.registry.addButton('textfield', {
                                            text: '▭ Text Field',
                                            tooltip: 'Insert text field',
                                            onAction: () => {
                                                editor.insertContent('<input type="text" class="ielts-textfield" value="Number" style="width: 60px; height: 25px; border: 1px solid #999; border-radius: 3px; padding: 4px 8px; margin: 0 4px; font-weight: bold; text-align: center;" /> ');
                                            }
                                        });

                                        // Add a menu button for more form elements
                                        editor.ui.registry.addMenuButton('formfields', {
                                            text: 'Form Fields',
                                            fetch: (callback) => {
                                                const items = [
                                                    {
                                                        type: 'menuitem',
                                                        text: 'Short Answer Field',
                                                        onAction: () => editor.insertContent('<input type="text" class="ielts-shortanswer" style="width: 100px; border-bottom: 1px solid #999;" />')
                                                    },
                                                    {
                                                        type: 'menuitem',
                                                        text: 'Number Field',
                                                        onAction: () => editor.insertContent('<input type="number" class="ielts-number" min="0" max="100" style="width: 60px; border: 1px solid #ddd; border-radius: 3px;" />')
                                                    },
                                                    {
                                                        type: 'menuitem',
                                                        text: 'Dropdown',
                                                        onAction: () => {
                                                            const html = `
                                                            <select class="ielts-select" style="border: 1px solid #ddd; border-radius: 3px; padding: 2px;">
                                                                <option value="">Select...</option>
                                                                <option value="option1">Option 1</option>
                                                                <option value="option2">Option 2</option>
                                                                <option value="option3">Option 3</option>
                                                            </select>
                                                            `;
                                                            editor.insertContent(html);
                                                        }
                                                    }
                                                ];
                                                callback(items);
                                            }
                                        });
                                    },
                                    content_style: `
    body { font-family:Helvetica,Arial,sans-serif; font-size:12pt }
    .question-separator { border-top: 2px solid #e5e7eb; margin: 1.5rem 0; position: relative; }
    .question-separator::before { content: 'Question Separator'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background-color: white; padding: 0 10px; color: #6b7280; font-size: 14px; }
    input[type="checkbox"].ielts-checkbox { margin-right: 5px; transform: scale(1.2); }
    input[type="radio"].ielts-radio { margin-right: 5px; transform: scale(1.2); }
    input[type="text"].ielts-textfield { 
        display: inline-block;
        background: white;
        border: 1px solid #999;
        border-radius: 3px;
        padding: 4px 8px;
        outline: none;
        width: 80px;
        height: 30px;
        font-weight: bold;
        text-align: center;
    }
    input[type="text"].ielts-textfield:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
    }
                                    .image-question-container {
                                        display: flex;
                                        align-items: flex-start;
                                        margin-bottom: 15px;
                                    }
                                    .image-container {
                                        margin-right: 15px;
                                    }
                                    .question-container {
                                        flex: 1;
                                    }
                                    `
                                }}

                            />

                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="h-full flex flex-col">
                    {/* Audio Section */}
                    <div className="bg-white p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">2</span>
                            Audio
                        </h3>
                        <div className="mt-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <Headphones className="text-violet-600" size={20} />
                                <span className="text-gray-700 truncate">
                                    {currentPart.audio_filename || 'No audio selected'}
                                </span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="audio/*"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                            {audioChanged && (
                                <p className="text-sm text-amber-600 mt-2">
                                    Audio file will be updated on save
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Answers Section */}
                    <div className="flex-1 overflow-auto">
                        <div className="bg-white p-4 border-b sticky top-0 z-10">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">3</span>
                                Answers
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {currentPart.questions.map((question, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Question {index + 1}
                                    </label>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-gray-500">Correct Answer</span>
                                            <input
                                                value={question.correct_answer}
                                                onChange={(e) => handleQuestionUpdate(index, 'correct_answer', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                                                placeholder="Enter the correct answer"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Locate (text to highlight in transcript)</span>
                                            <input
                                                value={question.locate || ''}
                                                onChange={(e) => handleQuestionUpdate(index, 'locate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter the phrase to locate in transcript"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Explanation (supports rich text formatting)</span>
                                            <RichTextEditor
                                                value={question.explanation || ''}
                                                onChange={(value) => handleQuestionUpdate(index, 'explanation', value)}
                                                className="w-full border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500"
                                                placeholder="Enter formatted explanation for this answer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-4 border-t">
                        <button
                            onClick={() => handleUpdatePart(currentStep)}
                            disabled={loading}
                            className={`w-full py-2 rounded-lg ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-700'
                                } text-white`}
                        >
                            {loading ? 'Saving...' : `Save Part ${currentStep}`}
                        </button>
                    </div>
                </div>
            </Split>
        </div>

    );
};

export default EditListeningTest;
