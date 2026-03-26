import React, { useState, useEffect } from 'react';
import RichTextEditor from '../editor/RichTextEditor';

const DescriptionDialog = ({ isOpen, onClose, description, currentDescription, onUpdate, title }) => {
    // Use currentDescription if provided, otherwise fall back to description for backward compatibility
    const descriptionText = currentDescription !== undefined ? currentDescription : description;
    const [newDescription, setNewDescription] = useState(descriptionText || '');
    
    // Update state when description prop changes
    useEffect(() => {
        const updatedDescription = currentDescription !== undefined ? currentDescription : description;
        setNewDescription(updatedDescription || '');
    }, [description, currentDescription]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onUpdate(newDescription);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{title || 'Edit Test Description'}</h2>
                
                <RichTextEditor
                    value={newDescription}
                    onChange={setNewDescription}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 h-32"
                    placeholder="Enter test description"
                />

                <div className="flex justify-end mt-4 space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptionDialog;
