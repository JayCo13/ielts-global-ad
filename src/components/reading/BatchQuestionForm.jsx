import React from 'react';
import { Plus } from 'lucide-react';

const BatchQuestionForm = ({ 
  batchQuestionData, 
  updateBatchQuestionData, 
  addBatchQuestions, 
  questionTypes 
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white">Questions</h3>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
          <select
            value={batchQuestionData.questionType}
            onChange={(e) => updateBatchQuestionData('questionType', e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 dark:text-gray-400">Count</label>
            <input
              type="number"
              min="1"
              max="20"
              value={batchQuestionData.count}
              onChange={(e) => updateBatchQuestionData('count', parseInt(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 dark:text-gray-400">Marks each</label>
            <input
              type="number"
              min="1"
              max="10"
              value={batchQuestionData.marks}
              onChange={(e) => updateBatchQuestionData('marks', parseInt(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          <button
            onClick={addBatchQuestions}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            <Plus size={16} className="mr-1" />
            Add Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchQuestionForm;