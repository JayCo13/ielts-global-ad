import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';

const MatchingOptionsEditor = ({ 
  question, 
  questionIndex, 
  updateQuestion,
  updateMatchingOption,
  removeMatchingOption,
  addMatchingOption
}) => {
  const questionType = question.question_type;
  const matchingOptions = question.matching_options || [];
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          {questionType === 'matching_headings' 
            ? 'Available Headings' 
            : questionType === 'matching_names' 
              ? 'Available Names/People' 
              : 'Available Options'}
        </h4>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-500 hover:text-gray-700"
          title="Show help"
        >
          <Info size={16} />
        </button>
      </div>
      
      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
          {questionType === 'matching_headings' ? (
            <p>For matching headings, students will match headings to paragraphs. Each paragraph can have only one heading, but a heading can be used multiple times or not at all.</p>
          ) : questionType === 'matching_names' ? (
            <p>For matching names, students will match names to statements. Each statement can have only one name, but a name can be used multiple times or not at all.</p>
          ) : (
            <p>For general matching, students will match options to questions. Each question can have only one option, but an option can be used multiple times or not at all.</p>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        {matchingOptions.map((option, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            {/* For matching headings, we don't need the option_text field (A, B, C) */}
            {questionType !== 'matching_headings' && (
              <div className="w-12">
                <input
                  type="text"
                  value={option.option_text || ''}
                  onChange={(e) => updateMatchingOption(questionIndex, idx, 'option_text', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  placeholder="A"
                />
              </div>
            )}
            
            <div className={questionType === 'matching_headings' ? "flex-1" : "flex-1"}>
              <input
                type="text"
                value={option.description || ''}
                onChange={(e) => updateMatchingOption(questionIndex, idx, 'description', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                placeholder={
                  questionType === 'matching_headings' 
                    ? 'Heading content' 
                    : questionType === 'matching_names' 
                      ? 'Person name' 
                      : 'Option description'
                }
              />
            </div>
            
            <div className="w-24">
              <input
                type="text"
                value={option.correct_for || ''}
                onChange={(e) => updateMatchingOption(questionIndex, idx, 'correct_for', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                placeholder="e.g. 1,3,5"
                title="Question numbers this option is correct for (comma separated)"
              />
            </div>
            
            <button
              onClick={() => removeMatchingOption(questionIndex, idx)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Only show Add button for the first question or if this is the only question */}
      {(question.paragraph_number === 1 || 
        (questionType === 'matching_headings' && question.paragraph_number === 1) || 
        (questionType !== 'matching_headings' && matchingOptions.length === 0)) && (
        <button
          onClick={() => addMatchingOption(questionIndex)}
          className="mt-2 flex items-center text-sm text-violet-600 hover:text-violet-800"
        >
          <Plus size={16} className="mr-1" />
          Add {
            questionType === 'matching_headings' 
              ? 'Heading' 
              : questionType === 'matching_names' 
                ? 'Person' 
                : 'Option'
          }
        </button>
      )}
      
      {questionType === 'matching_headings' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paragraph Number
          </label>
          <input
            type="number"
            min="1"
            value={question.paragraph_number || 1}
            onChange={(e) => updateQuestion(questionIndex, 'paragraph_number', parseInt(e.target.value))}
            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          />
        </div>
      )}
      
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
        <p className="font-medium mb-1">How to set correct answers:</p>
        <p>In the rightmost field, enter the question numbers this option is correct for, separated by commas.</p>
        <p className="mt-1">Example: If option A is correct for questions 1, 3, and 5, enter "1,3,5"</p>
        <p className="mt-1">Leave blank if the option is not a correct answer for any question.</p>
      </div>
    </div>
  );
};

export default MatchingOptionsEditor;