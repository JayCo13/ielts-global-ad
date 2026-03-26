import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
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
import DescriptionDialog from '../../components/dialogs/DescriptionDialog';
import API_BASE from '../../config/api';

const EditReadingTest = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const questionsEditorRef = useRef(null);
    const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
    // State management
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        duration: 3600,
        total_marks: 40,
        is_active: true
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [editorContent, setEditorContent] = useState('');
    const [questionsContent, setQuestionsContent] = useState('');
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [activePart, setActivePart] = useState(1);
    const [isPassageCollapsed, setIsPassageCollapsed] = useState(false);
    const [splitSizes, setSplitSizes] = useState([50, 50]);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [questionTypes, setQuestionTypes] = useState([]);
    const [explanations, setExplanations] = useState([]);
    const [locates, setLocates] = useState([]);
    const [currentPart, setCurrentPart] = useState({
        passage: {
            content: '',
            title: ''
        },
        questions: [],
        instructions: []
    });
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

    useEffect(() => {
        if (!examId) {
            console.error('No exam ID provided');
            navigate('/manage_test');
            toast.error('No exam ID provided. Redirecting back to test management.');
            return;
        }
        fetchTestData();
    }, [examId, navigate]);

    useEffect(() => {
        if (examId && currentStep >= 1 && currentStep <= 3) {
            fetchPartData(currentStep);
            setActivePart(currentStep);
        }
    }, [currentStep]);
    const handleDescriptionUpdate = async (newDescription) => {
        try {
            const response = await fetch(`${API_BASE}/admin/update-description/${examId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: newDescription
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update description');
            }

            const data = await response.json();
            setTestData({
                ...testData,
                description: data.description
            });
            toast.success('Test description updated successfully');
            setShowDescriptionDialog(false);
        } catch (error) {
            toast.error(error.message);
            console.error('Error updating test description:', error);
        }
    };
    const fetchTestData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/reading/reading-test/${examId}`, {
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
                duration: data.duration || 3600,
                total_marks: data.total_marks || 40,
                is_active: data.is_active
            });

            setCurrentStep(1);
        } catch (error) {
            toast.error('Failed to fetch test data');
            console.error('Error fetching test data:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchPartData = async (partNumber) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/reading/reading-test/${examId}/part-details/${partNumber}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch part ${partNumber} data`);
            }

            const data = await response.json();

            setCurrentPart({
                passage: {
                    content: data.passage?.content || '',
                    title: data.passage?.title || ''
                },
                questions: data.question_groups || [],
                instructions: []
            });

            setQuestionsContent(data.questions || '');

            // Load correct answers, question types, explanations, and locates if available
            if (data.question_groups && data.question_groups.length > 0) {
                const answers = [];
                const types = [];
                const explanationTexts = [];
                const locateTexts = [];

                // Extract answers, question types, explanations, and locates from the API response
                data.question_groups.forEach(group => {
                    if (group.questions && group.questions.length > 0) {
                        group.questions.forEach(question => {
                            answers.push(question.correct_answer || '');
                            types.push(question.question_type || 'fill_blank');
                            explanationTexts.push(question.explanation || '');
                            locateTexts.push(question.locate || '');
                        });
                    }
                });

                // If we have answers, use them; otherwise initialize with empty strings
                if (answers.length > 0) {
                    setCorrectAnswers(answers);
                    setQuestionTypes(types);
                    setExplanations(explanationTexts);
                    setLocates(locateTexts);
                } else {
                    // Fall back to default initialization
                    const answerCount = getAnswerCount(partNumber);
                    setCorrectAnswers(Array(answerCount).fill(''));
                    setQuestionTypes(Array(answerCount).fill('fill_blank'));
                    setExplanations(Array(answerCount).fill(''));
                    setLocates(Array(answerCount).fill(''));
                }
            } else {
                // No question data available, initialize with empty arrays
                const answerCount = getAnswerCount(partNumber);
                setCorrectAnswers(Array(answerCount).fill(''));
                setQuestionTypes(Array(answerCount).fill('fill_blank'));
                setExplanations(Array(answerCount).fill(''));
                setLocates(Array(answerCount).fill(''));
            }
        } catch (error) {
            toast.error(`Failed to fetch part ${partNumber} data`);
            console.error(`Error fetching part ${partNumber} data:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleTitleUpdate = async (newTitle) => {
        try {
            const response = await fetch(`${API_BASE}/admin/reading/reading-test/${examId}/title`, {
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

    // Get the number of answers based on the active part
    const getAnswerCount = (part) => {
        if (part === 1 || part === 2) return 13;
        if (part === 3) return 14;
        return 0;
    };

    // Initialize correct answers, question types, and explanations when active part changes
    useEffect(() => {
        const answerCount = getAnswerCount(activePart);
        setCorrectAnswers(Array(answerCount).fill(''));
        setQuestionTypes(Array(answerCount).fill('fill_blank')); // Default type
        setExplanations(Array(answerCount).fill(''));
    }, [activePart]);

    const handleQuestionTypeChange = (index, value) => {
        const newTypes = [...questionTypes];
        newTypes[index] = value;
        setQuestionTypes(newTypes);
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

        if (isPassageCollapsed) {
            // Check for empty answers
            const emptyAnswerIndex = correctAnswers.findIndex(answer => !answer.trim());
            if (emptyAnswerIndex !== -1) {
                toast.error(`Please provide correct answer for question ${emptyAnswerIndex + 1}`);
                return false;
            }

        }

        return true;

    };

    const renderLoadingState = () => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading test data...</p>
            </div>
        </div>
    );

    const handleUpdatePart = async (partNumber) => {
        if (!validatePart()) return;

        try {
            setLoading(true);
            const questionsData = correctAnswers.map((answer, index) => {
                const questionNumber = partNumber === 1 ? index + 1 :
                    partNumber === 2 ? index + 14 :
                        index + 27;

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

            const formData = new FormData();
            formData.append('passage_content', currentPart.passage.content);
            formData.append('passage_title', currentPart.passage.title);
            formData.append('question_content', questionsContent);
            formData.append('questions_json', JSON.stringify(questionsData));

            const response = await fetch(`${API_BASE}/admin/reading/reading-test/${examId}/part/${partNumber}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to save part ${partNumber}`);
            }

            toast.success(`Part ${partNumber} saved successfully!`);

            if (partNumber < 3) {
                setCurrentPart({
                    passage: { content: '', title: '' },
                    questions: [],
                    instructions: []
                });
                setQuestionsContent('');
                setCorrectAnswers(Array(getAnswerCount(partNumber + 1)).fill(''));
                setExplanations(Array(getAnswerCount(partNumber + 1)).fill(''));
                setCurrentStep(partNumber + 1);
                setActivePart(partNumber + 1);
                await fetchPartData(partNumber + 1);
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message);
            console.error(`Error updating part ${partNumber}:`, error);
        } finally {
            setLoading(false);
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

    const steps = [
        { number: 1, label: 'Part 1' },
        { number: 2, label: 'Part 2' },
        { number: 3, label: 'Part 3' }
    ];

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...correctAnswers];
        newAnswers[index] = value;
        setCorrectAnswers(newAnswers);
    };

    return loading && currentStep === 1 ? renderLoadingState() : (
        <div className="h-screen bg-gray-50 relative">
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
                            <div className="flex items-center">
                                Edit title:
                                <input
                                    type="text"
                                    value={testData.title}
                                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                    onBlur={(e) => handleTitleUpdate(e.target.value)}
                                    className="ml-2 text-black bg-transparent border-b border-black hover:border-violet-200 focus:border-violet-600 focus:outline-none px-2 py-1 rounded font-bold"
                                />
                                <button
                                    onClick={() => setShowDescriptionDialog(true)}
                                    className="ml-2 p-1.5 text-gray-500 hover:text-violet-600 transition-colors"
                                    title="Edit Description"
                                >
                                    <FileText size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex justify-center mt-4 space-x-4">
                <div className="flex space-x-4">
                    {steps.map((step) => (
                        <button
                            key={step.number}
                            onClick={() => {
                                if (!loading) {
                                    setCurrentStep(step.number);
                                    setActivePart(step.number);
                                }
                            }}
                            disabled={loading}
                            className={`
                                px-6 py-2 rounded-lg flex items-center space-x-2 mb-4
                                ${loading && currentStep === step.number ? 'bg-violet-400' : ''}
                                ${currentStep === step.number ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}
                                ${loading ? 'cursor-not-allowed opacity-75' : 'hover:bg-violet-500 hover:text-white'}
                            `}
                        >
                            {loading && currentStep === step.number ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Loading...</span>
                                </>
                            ) : (
                                step.label
                            )}
                        </button>
                    ))}
                </div>

                {!loading && (
                    <button
                        onClick={() => handleUpdatePart(activePart)}
                        className="px-6 py-2 rounded-lg mb-4 bg-violet-600 text-white hover:bg-violet-700 flex items-center"
                    >
                        {activePart < 3 ? `Save Part ${activePart} & Continue` : 'Complete Test'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="min-h-[600px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading part {currentStep}...</p>
                    </div>
                </div>
            ) : (
                <Split
                    className="flex h-[calc(100vh-140px)]"
                    sizes={splitSizes}
                    minSize={isPassageCollapsed ? 0 : 300}
                    gutterSize={8}
                    snapOffset={100}
                    dragInterval={1}
                    cursor="col-resize"
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

                                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                                    Locate
                                                </label>
                                                <input
                                                    type="text"
                                                    value={locates[index]}
                                                    onChange={(e) => handleLocateChange(index, e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    placeholder="Specify the location or reference for this answer (optional)"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DescriptionDialog
                        isOpen={showDescriptionDialog}
                        onClose={() => setShowDescriptionDialog(false)}
                        description={testData.description}
                        onUpdate={handleDescriptionUpdate}
                    />
                    <div className="h-full p-4 bg-white overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Questions for Part {activePart}</h3>
                        <QuestionEditor
                            value={questionsContent}
                            onChange={setQuestionsContent}
                        />
                    </div>
                </Split>

            )}
        </div>

    );
};

export default EditReadingTest;
