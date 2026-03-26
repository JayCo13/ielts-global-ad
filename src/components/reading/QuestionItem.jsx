import React from 'react';
import { Trash2 } from 'lucide-react';
import MatchingOptionsEditor from './MatchingOptionsEditor';

const QuestionItem = ({ 
  question, 
  index, 
  questionTypes, 
  updateQuestion, 
  updateQuestionOption, 
  removeQuestion 
}) => {
  // Add these functions for managing matching options
  const updateMatchingOption = (questionIndex, optionIndex, field, value) => {
    const updatedOptions = [...(question.matching_options || [])];
    
    if (!updatedOptions[optionIndex]) {
      updatedOptions[optionIndex] = {};
    }
    
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };
    
    updateQuestion(questionIndex, 'matching_options', updatedOptions);
  };
  
  const removeMatchingOption = (questionIndex, optionIndex) => {
    const updatedOptions = [...(question.matching_options || [])].filter(
      (_, idx) => idx !== optionIndex
    );
    updateQuestion(questionIndex, 'matching_options', updatedOptions);
  };
  
  const addMatchingOption = (questionIndex) => {
    const updatedOptions = [...(question.matching_options || [])];
    const nextLetter = updatedOptions.length > 0 
      ? String.fromCharCode(updatedOptions[updatedOptions.length - 1].option_text?.charCodeAt(0) + 1 || 65) 
      : 'A';
    
    updatedOptions.push({
      option_text: nextLetter,
      description: '',
      correct_for: ''
    });
    
    updateQuestion(questionIndex, 'matching_options', updatedOptions);
  };

  // Determine if this is a matching question type
  const isMatchingType = question.question_type === 'matching_headings' || 
                         question.question_type === 'matching_names' || 
                         question.question_type === 'matching';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={question.question_text}
            onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="Question text"
          />
        </div>
        <button
          onClick={() => removeQuestion(index)}
          className="ml-2 text-red-500 hover:text-red-700"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question Type
          </label>
          <select
            value={question.question_type}
            onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marks
          </label>
          <input
            type="number"
            min="1"
            value={question.marks}
            onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>
      </div>
      
      {/* Show correct answer field for fill_blank and short_answer */}
      {(question.question_type === 'fill_blank' || question.question_type === 'short_answer') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            value={question.correct_answer || ''}
            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="Correct answer"
          />
        </div>
      )}
      
      {/* Show options for multiple choice */}
      {question.question_type === 'multiple_choice' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Options
          </label>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center mb-2">
              <input
                type="radio"
                checked={option.is_correct}
                onChange={() => updateQuestionOption(index, optionIndex, 'is_correct', true)}
                className="mr-2"
              />
              <input
                type="text"
                value={option.option_text}
                onChange={(e) => updateQuestionOption(index, optionIndex, 'option_text', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder={`Option ${optionIndex + 1}`}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Show options for true/false/not given */}
      {question.question_type === 'true_false' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Options
          </label>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center mb-2">
              <input
                type="radio"
                checked={option.is_correct}
                onChange={() => updateQuestionOption(index, optionIndex, 'is_correct', true)}
                className="mr-2"
              />
              <span className="px-3 py-2">{option.option_text}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Add matching options editor for matching question types */}
      {isMatchingType && (
        <MatchingOptionsEditor
          question={question}
          questionIndex={index}
          updateQuestion={updateQuestion}
          updateMatchingOption={updateMatchingOption}
          removeMatchingOption={removeMatchingOption}
          addMatchingOption={addMatchingOption}
        />
      )}
    </div>
  );
};

export default QuestionItem;