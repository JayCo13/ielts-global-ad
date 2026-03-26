import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home, FileText, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { ToastContainer, toast } from 'react-toastify';
import TestDetailsDialog from '../../components/TestDetailsDialog';
import '../../css/split.css';
import Split from 'react-split';
import 'react-toastify/dist/ReactToastify.css';
import PassageEditor from '../../components/editor/PassageEditor';
import QuestionEditor from '../../components/editor/QuestionEditor';
import RichTextEditor from '../../components/editor/RichTextEditor';
import API_BASE from '../../config/api';

const CreateReadingTest = () => {
    const QUESTION_TYPES = [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'fill_blank', label: 'Fill in the Blank' },
        { value: 'matching_headings', label: 'Matching Headings' },
        { value: 'matching_names', label: 'Matching Names' },
        { value: 'matching', label: 'Matching Information' },
        { value: 'true_false_not_given', label: 'True/False/Not Given' },
        { value: 'yes_no_not_given', label: 'Yes/No/Not Given' },
        { value: 'long_answer', label: 'Long Answer' }
    ];

    const navigate = useNavigate();
    const editorRef = useRef(null);
    const questionsEditorRef = useRef(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editorContent, setEditorContent] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [questionsContent, setQuestionsContent] = useState('');
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        duration: 3600, // 60 minutes for reading test
        total_marks: 40,
        part1_description: '',
        part2_description: '',
        part3_description: ''
    });

    const [examId, setExamId] = useState(null);
    const [activePart, setActivePart] = useState(1);
    const [isPassageCollapsed, setIsPassageCollapsed] = useState(false);
    const [splitSizes, setSplitSizes] = useState([50, 50]);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [questionTypes, setQuestionTypes] = useState([]);
    const [explanations, setExplanations] = useState([]);
    const [locates, setLocates] = useState([]);

    // Initialize correct answers, question types, explanations, and locates when active part changes
    React.useEffect(() => {
        const answerCount = getAnswerCount(activePart);
        setCorrectAnswers(Array(answerCount).fill(''));
        setQuestionTypes(Array(answerCount).fill('fill_blank')); // Default type
        setExplanations(Array(answerCount).fill(''));
        setLocates(Array(answerCount).fill(''));
    }, [activePart]);

    const handleQuestionTypeChange = (index, value) => {
        const newTypes = [...questionTypes];
        newTypes[index] = value;
        setQuestionTypes(newTypes);
    };
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
            const listeningKey = keys.find(key => key.type === 'listening' && key.is_active);
            if (listeningKey) {
                setApiKey(listeningKey.key);
            }
            console.log('API Key:', listeningKey.key);
        } catch (error) {
            console.error('Error fetching API key:', error);
            toast.error('Failed to fetch API key');
        }
    };
    useEffect(() => {
        fetchApiKey();
    }, []);
    const [currentPart, setCurrentPart] = useState({
        passage: {
            content: '',
            title: ''
        },
        questions: [],
        instructions: []
    });

    // Get the number of answers based on the active part
    const getAnswerCount = (part) => {
        if (part === 1 || part === 2) return 13;
        if (part === 3) return 14;
        return 0;
    };

    // Initialize correct answers when active part changes or when component mounts
    React.useEffect(() => {
        const answerCount = getAnswerCount(activePart);
        setCorrectAnswers(Array(answerCount).fill(''));
    }, [activePart]);

    const validateInitialization = () => {
        if (!testData.title.trim()) {
            toast.error('Please enter a test title');
            return false;
        }
        return true;
    };

    const validatePart = () => {
        // Validate passage title
        if (!currentPart.passage.title.trim()) {
            toast.error('Please enter a passage title');
            return false;
        }

        // Validate passage
        if (!currentPart.passage.content.trim()) {
            toast.error('Please enter the reading passage');
            return false;
        }

        // Validate questions content
        if (!questionsContent.trim()) {
            toast.error('Please enter questions');
            return false;
        }

        // Validate correct answers regardless of passage collapse state
        // Check for empty answers
        const emptyAnswerIndex = correctAnswers.findIndex(answer => !answer.trim());
        if (emptyAnswerIndex !== -1) {
            toast.error(`Please provide correct answer for question ${emptyAnswerIndex + 1}`);
            return false;
        }

        // Check for answers that are too long (more than 50 characters)
        const tooLongAnswerIndex = correctAnswers.findIndex(answer => answer.trim().length > 50);
        if (tooLongAnswerIndex !== -1) {
            toast.error(`Answer for question ${tooLongAnswerIndex + 1} is too long (maximum 50 characters)`);
            return false;
        }

        return true;

    };

    const handleInitializeTest = async () => {
        if (!validateInitialization()) return;

        try {
            const response = await fetch(`${API_BASE}/admin/reading/initialize-reading-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(testData)
            });

            if (!response.ok) {
                const errorData = await response.json();
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
            // Create questions data from correct answers and explanations
            const questionsData = correctAnswers.map((answer, index) => {
                // Calculate the correct question number based on the part
                let questionNumber;
                if (partNumber === 1) {
                    questionNumber = index + 1;
                } else if (partNumber === 2) {
                    questionNumber = index + 14;
                } else {
                    questionNumber = index + 27;
                }

                return {
                    question_type: questionTypes[index],
                    question_text: `Question ${questionNumber}`,
                    correct_answer: answer,
                    explanation: explanations[index] || '',
                    locate: locates[index] || '',
                    marks: 1,
                    options: []
                };
            });

            // Create FormData object
            const formData = new FormData();
            formData.append('passage_content', currentPart.passage.content);
            formData.append('passage_title', currentPart.passage.title);
            formData.append('question_content', questionsContent);
            formData.append('questions_json', JSON.stringify(questionsData));

            const response = await fetch(`${API_BASE}/admin/reading/reading-test/${examId}/part/${partNumber}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    // Note: Do not set Content-Type when using FormData
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.detail || `Failed to save part ${partNumber}`);
                return;
            }

            if (partNumber < 3) {
                setCurrentPart({
                    passage: {
                        content: '',
                        title: ''
                    },
                    questions: [],
                    instructions: []
                });
                setQuestionsContent('');
                setCorrectAnswers(Array(getAnswerCount(partNumber + 1)).fill(''));
                setExplanations(Array(getAnswerCount(partNumber + 1)).fill(''));
                setLocates(Array(getAnswerCount(partNumber + 1)).fill(''));
                setCurrentStep(partNumber + 2);
                setActivePart(partNumber + 1);
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

    const togglePassageCollapse = () => {
        setIsPassageCollapsed(!isPassageCollapsed);
        if (isPassageCollapsed) {
            // Expand passage panel back to 50/50
            setSplitSizes([50, 50]);
        } else {
            // Collapse passage panel to give more space to questions
            setSplitSizes([50, 50]);
        }
    };

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...correctAnswers];
        newAnswers[index] = value;
        setCorrectAnswers(newAnswers);
    };

    const handleExplanationChange = (index, value) => {
        const newExplanations = [...explanations];
        newExplanations[index] = value;
        setExplanations(newExplanations);
    };

    const handleLocateChange = (index, value) => {
        const newLocates = [...locates];
        newLocates[index] = value;
        setLocates(newLocates);
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <ToastContainer position="top-right" />
            <TestDetailsDialog
                isOpen={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                testData={testData}
                examId={examId}
                currentStep={currentStep}
            />

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <Link to="/" className="text-gray-400 hover:text-violet-600">
                                <Home size={20} />
                            </Link>
                            <ChevronRight className="text-gray-400" size={20} />
                            <span className="text-violet-600">Create Reading Test</span>
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
                                className="w-full px-4 py-2 rounded-lg border"
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
                    sizes={splitSizes}
                    minSize={isPassageCollapsed ? 0 : 300}
                    gutterSize={8}
                    onDragEnd={(sizes) => setSplitSizes(sizes)}
                >
                    <div className="h-full bg-white overflow-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Reading Passage {activePart}</h3>
                                <button
                                    onClick={togglePassageCollapse}
                                    className="p-1 rounded-md hover:bg-gray-100"
                                    title={isPassageCollapsed ? "Expand passage" : "Collapse passage"}
                                >
                                    {isPassageCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                </button>
                            </div>

                            <div className={`transition-all duration-300 ${isPassageCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Passage Title
                                    </label>
                                    <input
                                        type="text"
                                        value={currentPart.passage.title}
                                        onChange={(e) => setCurrentPart(prev => ({
                                            ...prev,
                                            passage: {
                                                ...prev.passage,
                                                title: e.target.value
                                            }
                                        }))}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="Enter passage title"
                                    />
                                </div>

                                <PassageEditor
                                    value={currentPart.passage.content}
                                    onChange={(content) => {
                                        setCurrentPart(prev => ({
                                            ...prev,
                                            passage: {
                                                ...prev.passage,
                                                content
                                            }
                                        }));
                                    }}
                                />
                            </div>

                            {/* Update the Correct Answers Section */}
                            {isPassageCollapsed && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-4">Correct Answers for Part {activePart}</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {correctAnswers.map((answer, index) => (
                                            <div key={index} className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Question {index + 1}
                                                </label>

                                                <input
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-md ${!answer.trim() ? 'border-red-300' : answer.length > 50 ? 'border-yellow-300' : 'border-green-300'}`}
                                                    placeholder={`Answer ${index + 1}`}
                                                    maxLength={100}
                                                />
                                                <div className="flex justify-between text-xs mt-1 mb-2">
                                                    <span className={`${!answer.trim() ? 'text-red-500' : ''}`}>
                                                        {!answer.trim() ? 'Required' : ''}
                                                    </span>
                                                    <span className={`${answer.length > 50 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                                        {answer.length}/50
                                                    </span>
                                                </div>

                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Explanation
                                                </label>
                                                <RichTextEditor
                                                    value={explanations[index]}
                                                    onChange={(value) => handleExplanationChange(index, value)}
                                                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                                                    placeholder="Provide an explanation for this answer (optional)"
                                                />

                                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                                                    Locate
                                                </label>
                                                <input
                                                    type="text"
                                                    value={locates[index]}
                                                    onChange={(e) => handleLocateChange(index, e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    placeholder="Specify the location/reference for this answer (optional)"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-full p-4 bg-white overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Questions for Part {activePart}</h3>
                        <QuestionEditor
                            value={questionsContent}
                            onChange={setQuestionsContent}
                        />

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => handleUpdatePart(activePart)}
                                className="bg-violet-600 text-white px-6 py-2 rounded-lg"
                            >
                                {activePart < 3 ? `Save Part ${activePart} & Continue` : 'Complete Test'}
                            </button>
                        </div>
                    </div>
                </Split>
            )}
        </div>
    );
};

export default CreateReadingTest;

// Add these helper functions outside the Editor component
const showMultipleChoiceDialog = (editor) => {
    editor.windowManager.open({
        title: 'Create Multiple Choice Question',
        body: {
            type: 'panel',
            items: [
                {
                    type: 'input',
                    name: 'option1',
                    label: 'Option A'
                },
                {
                    type: 'input',
                    name: 'option2',
                    label: 'Option B'
                },
                {
                    type: 'input',
                    name: 'option3',
                    label: 'Option C'
                },
                {
                    type: 'input',
                    name: 'option4',
                    label: 'Option D'
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
        onSubmit: function (api) {
            const data = api.getData();
            const content = `
<div class="question-format multiple-choice">
    <div class="options">
        <div class="option"><input type="radio" name="q${Date.now()}"> ${data.option1}</div>
        <div class="option"><input type="radio" name="q${Date.now()}"> ${data.option2}</div>
        <div class="option"><input type="radio" name="q${Date.now()}"> ${data.option3}</div>
        <div class="option"><input type="radio" name="q${Date.now()}"> ${data.option4}</div>
    </div>
</div>
`;
            editor.insertContent(content);
            api.close();
        }
    });
};

const showTrueFalseDialog = (editor) => {
    editor.insertContent(`
<div class="question-format true-false">
    <div class="options">
        <div class="option"><input type="radio" name="q${Date.now()}"> True</div>
        <div class="option"><input type="radio" name="q${Date.now()}"> False</div>
        <div class="option"><input type="radio" name="q${Date.now()}"> Not Given</div>
    </div>
</div>
`);
};

// Add these helper functions
const showLayoutDialog = (editor) => {
    editor.windowManager.open({
        title: 'Create Layout',
        body: {
            type: 'panel',
            items: [
                {
                    type: 'selectbox',
                    name: 'layout',
                    label: 'Layout Style',
                    items: [
                        { value: 'standard', text: 'Standard Reading Layout' },
                        { value: 'two_column', text: 'Two Column Layout' },
                        { value: 'title_subtitle', text: 'Title with Subtitle' }
                    ]
                },
                {
                    type: 'selectbox',
                    name: 'font',
                    label: 'Font',
                    items: [
                        { value: 'arial', text: 'Arial' },
                        { value: 'times', text: 'Times New Roman' },
                        { value: 'calibri', text: 'Calibri' }
                    ]
                },
                {
                    type: 'selectbox',
                    name: 'fontSize',
                    label: 'Font Size',
                    items: [
                        { value: '12pt', text: '12pt' },
                        { value: '14pt', text: '14pt' },
                        { value: '16pt', text: '16pt' }
                    ]
                },
                {
                    type: 'selectbox',
                    name: 'lineSpacing',
                    label: 'Line Spacing',
                    items: [
                        { value: '1.0', text: 'Single' },
                        { value: '1.5', text: '1.5 lines' },
                        { value: '2.0', text: 'Double' }
                    ]
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
                text: 'Apply',
                primary: true
            }
        ],
        onSubmit: function (api) {
            const data = api.getData();
            applyLayout(editor, data.layout, {
                font: data.font,
                fontSize: data.fontSize,
                lineSpacing: data.lineSpacing
            });
            api.close();
        }
    });
};

const applyLayout = (editor, layoutType, options = {}) => {
    const layouts = {
        standard: `
            <div class="reading-passage" style="font-family: ${options.font || 'arial'}; font-size: ${options.fontSize || '12pt'}; line-height: ${options.lineSpacing || '1.5'};">
                <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Title</h1>
                <p style="margin-bottom: 15px;">Paragraph 1</p>
                <p style="margin-bottom: 15px;">Paragraph 2</p>
            </div>
        `,
        two_column: `
            <div style="display: flex; gap: 20px; font-family: ${options.font || 'arial'}; font-size: ${options.fontSize || '12pt'}; line-height: ${options.lineSpacing || '1.5'};">
                <div style="flex: 1;">
                    <p style="margin-bottom: 15px;">Left Column</p>
                </div>
                <div style="flex: 1;">
                    <p style="margin-bottom: 15px;">Right Column</p>
                </div>
            </div>
        `,
        title_subtitle: `
            <div class="reading-passage" style="font-family: ${options.font || 'arial'}; font-size: ${options.fontSize || '12pt'}; line-height: ${options.lineSpacing || '1.5'};">
                <h1 style="text-align: center; font-size: 24px; margin-bottom: 10px;">Main Title</h1>
                <p style="text-align: center; font-style: italic; margin-bottom: 20px;">Subtitle</p>
                <p style="margin-bottom: 15px;">Paragraph content</p>
            </div>
        `
    };

    editor.insertContent(layouts[layoutType]);
};
