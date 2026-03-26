import React from 'react';

const PassageEditor = ({ activePart, updatePassage }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Reading Passage</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Passage Title
        </label>
        <input
          type="text"
          value={activePart.passage.title}
          onChange={(e) => updatePassage('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder="Enter passage title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Passage Content
        </label>
        <textarea
          value={activePart.passage.content}
          onChange={(e) => updatePassage('content', e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
          placeholder="Enter passage content"
        />
      </div>
    </div>
  );
};

export default PassageEditor;