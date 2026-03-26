import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Save, AlertCircle } from 'lucide-react';
import PassageEditor from './PassageEditor';
import BatchQuestionForm from './BatchQuestionForm';
import QuestionItem from './QuestionItem';
import InstructionModal from './InstructionModal';

const TestEditor = ({
  examData,
  activeTab,
  setActiveTab,
  error,
  success,
  loading,
  leftPanelWidth,
  containerRef,
  handleMouseDown,
  getActivePart,
  updatePassage,
  batchQuestionData,
  updateBatchQuestionData,
  addBatchQuestions,
  addQuestion,
  questionTypes,
  updateQuestion,
  updateQuestionOption,
  removeQuestion,
  savePart,
  showInstructionModal,
  setShowInstructionModal,
  instructionData,
  setInstructionData,
  saveInstruction
}) => {
  const activePart = getActivePart();
  
  // Move renderQuestions function inside the component
  const renderQuestions = () => {
    const sortedQuestions = [...activePart.questions].sort((a, b) => {
      const numA = parseInt(a.question_text.replace("Question ", ""));
      const numB = parseInt(b.question_text.replace("Question ", ""));
      return numA - numB;
    });
    
    // Sort instructions by startQuestion
    const sortedInstructions = [...activePart.instructions].sort(
      (a, b) => a.startQuestion - b.startQuestion
    );
    
    const result = [];
    let currentInstructionIndex = 0;
    
    sortedQuestions.forEach((question, index) => {
      const questionNumber = parseInt(question.question_text.replace("Question ", ""));
      
      // Check if we need to display an instruction before this question
      while (
        currentInstructionIndex < sortedInstructions.length && 
        sortedInstructions[currentInstructionIndex].startQuestion === questionNumber
      ) {
        const instruction = sortedInstructions[currentInstructionIndex];
        result.push(
          <div key={`instruction-${currentInstructionIndex}`} className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                Questions {instruction.startQuestion}–{instruction.endQuestion}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setInstructionData({
                      ...instruction,
                      index: currentInstructionIndex
                    });
                    setShowInstructionModal(true);
                  }}
                  className="text-violet-600 hover:text-violet-800 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
              {instruction.instruction}
            </div>
          </div>
        );
        currentInstructionIndex++;
      }
      
      // Render the question
      result.push(
        <div key={`question-${index}`} className="mb-4">
          <QuestionItem
            question={question}
            index={index}
            questionTypes={questionTypes}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            removeQuestion={removeQuestion}
          />
        </div>
      );
    });
    
    return result;
  };

  return (
    <div className="p-4">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Link to="/admin/exams" className="text-gray-400 hover:text-violet-600 transition-colors">
                <Home size={20} />
              </Link>
              <ChevronRight size={20} className="text-gray-400" />
              <span className="text-violet-600 dark:text-violet-400">
                Create Reading Test
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {examData.title}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          {[1, 2, 3].map((part) => (
            <button
              key={part}
              onClick={() => setActiveTab(`part${part}`)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === `part${part}`
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Part {part}
            </button>
          ))}
        </div>
      </div>
      
      {/* Resizable panels */}
      <div 
        ref={containerRef}
        className="flex h-[calc(100vh-240px)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Left panel - Passage */}
        <div className="overflow-auto" style={{ width: `${leftPanelWidth}%` }}>
          <PassageEditor activePart={activePart} updatePassage={updatePassage} />
        </div>
        
        {/* Resizer */}
        <div 
          className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-violet-300 dark:hover:bg-violet-700 cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
        
        {/* Right panel - Questions */}
        <div className="overflow-auto" style={{ width: `${100 - leftPanelWidth}%` }}>
          <div className="p-4">
       
            <BatchQuestionForm 
              batchQuestionData={batchQuestionData}
              updateBatchQuestionData={updateBatchQuestionData}
              addBatchQuestions={addBatchQuestions}
              questionTypes={questionTypes}
            />
            
            {activePart.questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No questions added yet. Click "Add Question" to start.
              </div>
            ) : (
              <div className="space-y-6">
                {renderQuestions()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={savePart}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} className="mr-2" />
          {loading ? 'Saving...' : `Save Part ${activeTab.replace('part', '')}`}
        </button>
      </div>
      
      {/* Instruction Modal */}
      <InstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        instruction={instructionData.instruction}
        setInstruction={(value) => setInstructionData({...instructionData, instruction: value})}
        startQuestion={instructionData.startQuestion}
        setStartQuestion={(value) => setInstructionData({...instructionData, startQuestion: value})}
        endQuestion={instructionData.endQuestion}
        setEndQuestion={(value) => setInstructionData({...instructionData, endQuestion: value})}
        saveInstruction={saveInstruction}
      />
    </div>
  );
};

export default TestEditor;