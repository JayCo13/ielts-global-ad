import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home, Headphones, Info, Bold } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { ToastContainer, toast } from 'react-toastify';
import TestDetailsDialog from '../../components/TestDetailsDialog';
import RichTextEditor from '../../components/editor/RichTextEditor';
import '../../css/split.css';
import Split from 'react-split';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-grid-layout/css/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../config/api';

const CreateListeningTest = () => {
    const QUESTION_TYPES = [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'three_options', label: 'Three Options' },
        { value: 'two_options', label: 'Two Options' },
        { value: 'fill_in_blank', label: 'Fill in the Blank' },
        { value: 'map', label: 'Map' },
        { value: 'matching', label: 'Matching' },
        { value: 'true_false', label: 'True/False' }
    ];

    const navigate = useNavigate();
    // Add editorRef at the top with other refs and state
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);  // Add this line
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editorContent, setEditorContent] = useState('');
    const [questionTypeCollapsed, setQuestionTypeCollapsed] = useState(false);
    const [testData, setTestData] = useState({
        title: '',
        duration: 2400,
        total_marks: 40,
        part1_description: '',
        part2_description: '',
        part3_description: '',
        part4_description: ''
    });

    const [examId, setExamId] = useState(null);

    const questionColumns = [
        { field: 'question_number', headerName: '#', width: 70 },
        { field: 'question_type', headerName: 'Type', width: 130 },
        { field: 'question_text', headerName: 'Question', width: 300 },
        { field: 'marks', headerName: 'Marks', width: 100 }
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
                    options: Array(8).fill({ option_text: '', is_correct: false }) // Typical map questions have 8 location options
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

    const [currentPart, setCurrentPart] = useState({
        audioFile: null,
        transcript: '',
        questions: Array(10).fill(null).map(() => getInitialQuestionState())
    });

    const handleEditorChange = (content) => {
        setEditorContent(content);
        const updatedQuestions = [...currentPart.questions];
        updatedQuestions[currentIndex].question_text = content;
        setCurrentPart({
            ...currentPart,
            questions: updatedQuestions
        });
    };

    const handleQuestionUpdate = (params) => {
        const { data, colDef, newValue } = params;
        const index = currentPart.questions.findIndex(q => q === data);
        const updatedQuestions = [...currentPart.questions];
        updatedQuestions[index][colDef.field] = newValue;
        setCurrentPart({
            ...currentPart,
            questions: updatedQuestions
        });
    };

    const steps = [
        { number: 1, label: 'Initialize' },
        { number: 2, label: 'Part 1' },
        { number: 3, label: 'Part 2' },
        { number: 4, label: 'Part 3' },
        { number: 5, label: 'Part 4' }
    ];

    const validateInitialization = () => {
        if (!testData.title.trim()) {
            toast.error('Please enter a test title');
            return false;
        }
        return true;
    };

    const validatePart = () => {
        // Validate question types
        const hasAllQuestionTypes = currentPart.questions.every(q => q && q.question_type);
        if (!hasAllQuestionTypes) {
            toast.error('Please select question types for all questions');
            return false;
        }

        // Validate audio file
        if (!currentPart.audioFile) {
            toast.error('Please upload an audio file');
            return false;
        }

        // Validate correct answers
        const hasAllAnswers = currentPart.questions.every(q => q && q.correct_answer.trim());
        if (!hasAllAnswers) {
            toast.error('Please input all correct answers');
            return false;
        }

        return true;
    };

    const handleInitializeTest = async () => {
        if (!validateInitialization()) return;

        try {
            const response = await fetch(`${API_BASE}/admin/initialize-listening-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(testData)
            });

            // Check if the response is not ok (e.g., 400 status code)
            if (!response.ok) {
                const errorData = await response.json();
                // Display the specific error message from the backend
                toast.error(errorData.detail || 'Failed to initialize test');
                return;
            }

            const data = await response.json();
            setExamId(data.exam_id);
            setCurrentStep(2);
            toast.success('Test initialized successfully!');
        } catch (error) {
            toast.error('Failed to initialize test');
            console.error('Error initializing test:', error);
        }
    };

    const handleUpdatePart = async (partNumber) => {
        if (!validatePart()) return;

        try {
            // Format questions before sending to database
            const formattedQuestions = currentPart.questions.map(question => {
                let formattedQuestion = { ...question };

                // Handle map questions
                if (question.question_type === 'map') {
                    formattedQuestion = {
                        ...question,
                        question_type: 'map',
                        options: question.options.filter(opt => opt.option_text.trim() !== '')  // Only include non-empty options
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
            formData.append('audio_file', currentPart.audioFile);
            formData.append('transcript', editorContent);
            formData.append('questions_json', JSON.stringify(formattedQuestions));

            const response = await fetch(`${API_BASE}/admin/listening-test/${examId}/part/${partNumber}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (partNumber < 4) {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setCurrentPart({
                    audioFile: null,
                    transcript: '',
                    questions: Array(10).fill(null).map(() => getInitialQuestionState())
                });
                setCurrentStep(partNumber + 2);
                toast.success(`Part ${partNumber} saved successfully!`);
            } else {
                toast.success('Test completed successfully!');
                navigate('/');
            }
        } catch (error) {
            toast.error(`Failed to save part ${partNumber}`);
            console.error('Error updating part:', error);
        }
    };

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

            {/* Floating Info Button */}
            <button
                onClick={() => setShowDetailsDialog(true)}
                className="fixed top-12 right-4 z-50 p-2 bg-violet-600 rounded-full shadow-lg text-white hover:bg-violet-700 hover:shadow-xl transition-all duration-200 animate-ring"
                title="Test Details"
            >
                <Info size={20} />
            </button>

            {/* Use the separate TestDetailsDialog component */}
            <TestDetailsDialog
                isOpen={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                testData={testData}
                examId={examId}
                currentStep={currentStep}
            />

            {/* Remove the button from the nav and continue with existing code */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <Link to="/" className="text-gray-400 hover:text-violet-600">
                                <Home size={20} />
                            </Link>
                            <ChevronRight className="text-gray-400" size={20} />
                            <span className="text-violet-600">Create Listening Test</span>
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

            {currentStep === 1 ? (
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="space-y-6">
                            <input
                                type="text"
                                value={testData.title}
                                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border text-black [&::placeholder]:text-black"
                                placeholder="Enter test title"
                            />
                            <div className="grid grid-cols-1 gap-4">
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part 1 Description</label>
                                    <RichTextEditor
                                        value={testData.part1_description}
                                        onChange={(html) => setTestData({ ...testData, part1_description: html })}
                                        className="w-full px-4 py-2 rounded-lg border text-black [&::placeholder]:text-black min-h-[150px]"
                                        placeholder="Enter detailed description for Part 1"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part 2 Description</label>
                                    <RichTextEditor
                                        value={testData.part2_description}
                                        onChange={(html) => setTestData({ ...testData, part2_description: html })}
                                        className="w-full px-4 py-2 rounded-lg border text-black [&::placeholder]:text-black min-h-[150px]"
                                        placeholder="Enter detailed description for Part 2"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part 3 Description</label>
                                    <RichTextEditor
                                        value={testData.part3_description}
                                        onChange={(html) => setTestData({ ...testData, part3_description: html })}
                                        className="w-full px-4 py-2 rounded-lg border text-black [&::placeholder]:text-black min-h-[150px]"
                                        placeholder="Enter detailed description for Part 3"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part 4 Description</label>
                                    <RichTextEditor
                                        value={testData.part4_description}
                                        onChange={(html) => setTestData({ ...testData, part4_description: html })}
                                        className="w-full px-4 py-2 rounded-lg border text-black [&::placeholder]:text-black min-h-[150px]"
                                        placeholder="Enter detailed description for Part 4"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleInitializeTest}
                                className="w-full bg-violet-600 text-white py-2 rounded-lg"
                            >
                                Initialize Test
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <Split
                    className="flex h-[calc(100vh-64px)]"
                    sizes={[50, 50]}
                    minSize={300}
                >
                    <div className="h-full flex flex-col">
                        <div className={`bg-white p-4 border-t border-b ${questionTypeCollapsed ? 'cursor-pointer' : ''} hidden`}>
                            <div
                                className="flex items-center justify-between mb-4"
                                onClick={() => setQuestionTypeCollapsed(!questionTypeCollapsed)}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">1</span>
                                    Choose question type
                                </h3>
                                <button className="text-gray-500 hover:text-violet-600">
                                    {questionTypeCollapsed ? '▼ Show' : '▲ Hide'}
                                </button>
                            </div>

                            {!questionTypeCollapsed && (
                                <div className="grid grid-cols-5 gap-4">
                                    {[...Array(10)].map((_, idx) => (
                                        <div key={idx} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Q{idx + 1}</span>
                                                <span className="text-sm text-gray-500">Type:</span>
                                            </div>
                                            <select
                                                value={currentPart.questions[idx]?.question_type}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...currentPart.questions];
                                                    updatedQuestions[idx] = getInitialQuestionState(e.target.value);
                                                    setCurrentPart({
                                                        ...currentPart,
                                                        questions: updatedQuestions
                                                    });
                                                }}
                                                className="w-full px-2 py-1 rounded border text-sm focus:ring-2 focus:ring-violet-500"
                                            >
                                                {QUESTION_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-700 p-4 bg-white border-b flex items-center">
                                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">2</span>
                                Input questions
                            </h3>
                            <div className={`${questionTypeCollapsed ? 'h-[calc(100%-60px)]' : 'h-[calc(100%-60px)]'}`}>
                                <Editor
                                    apiKey="mbitaig1o57ii8l8aa8wx4b4le9cc1e0aw5t2c1lo4axii6u"
                                    onInit={(evt, editor) => editorRef.current = editor}
                                    value={currentPart.questions[currentIndex]?.question_text}
                                    init={{
                                        height: '100%',
                                        menubar: false,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                                            'noneditable'
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
                                    onEditorChange={handleEditorChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-full flex flex-col overflow-auto">
                        <div className="p-4 space-y-4 flex-1">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">3</span>
                                    Choose audio file
                                </h3>
                                <div className="audio-upload mb-6">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => {
                                            setCurrentPart({
                                                ...currentPart,
                                                audioFile: e.target.files[0]
                                            });
                                        }}
                                        className="w-full p-2 border rounded text-black [&::placeholder]:text-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm mr-2">4</span>
                                    Input correct answers
                                </h3>
                                <div className="answers-grid grid gap-4">
                                    {Array(10).fill(null).map((_, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="w-8 text-center font-medium">{index + 1}</span>
                                            <input
                                                type="text"
                                                value={currentPart.questions[index]?.correct_answer || ''}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...currentPart.questions];
                                                    updatedQuestions[index].correct_answer = e.target.value;
                                                    setCurrentPart({
                                                        ...currentPart,
                                                        questions: updatedQuestions
                                                    });
                                                }}
                                                className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-violet-500 text-black [&::placeholder]:text-black"
                                                placeholder={`Answer ${index + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 p-4 bg-white border-t">
                            <button
                                onClick={() => handleUpdatePart(currentStep - 1)}
                                className="w-full px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                            >
                                {currentStep === 5 ? 'Finish' : 'Next Part'}
                            </button>
                        </div>
                    </div>
                </Split>
            )}
        </div>
    );
};

export default CreateListeningTest;
