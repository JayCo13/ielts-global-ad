import React from 'react';
import { AlertCircle } from 'lucide-react';

const InitializationForm = ({ 
  testTitle, 
  setTestTitle, 
  testDuration, 
  setTestDuration, 
  totalMarks, 
  setTotalMarks, 
  initializeTest, 
  loading, 
  error 
}) => {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Initialize Reading Test</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Test Title
        </label>
        <input
          type="text"
          value={testTitle}
          onChange={(e) => setTestTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder="Enter test title"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={testDuration}
          onChange={(e) => setTestDuration(parseInt(e.target.value))}
          min="1"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Total Marks
        </label>
        <input
          type="number"
          value={totalMarks}
          onChange={(e) => setTotalMarks(parseInt(e.target.value))}
          min="1"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
      </div>
      
      <button
        onClick={initializeTest}
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Initializing...' : 'Initialize Test'}
      </button>
    </div>
  );
};

export default InitializationForm;