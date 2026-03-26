import React, { useRef, useEffect } from 'react';

/**
 * CustomEditor - A proprietary rich text editor component
 * 
 * This component provides a rich text editing experience with similar functionality
 * to TinyMCE but using our own proprietary implementation.
 */
const CustomEditor = ({ value, onEditorChange, height = '200px', plugins = [], toolbar = '' }) => {
    const editorRef = useRef(null);
    
    // Initialize editor on mount
    useEffect(() => {
        if (editorRef.current) {
            // Set initial content
            editorRef.current.innerHTML = value || '';
        }
    }, []);

    // Update editor content when value prop changes
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    // Handle content changes
    const handleInput = () => {
        if (editorRef.current && onEditorChange) {
            onEditorChange(editorRef.current.innerHTML);
        }
    };

    // Apply formatting
    const applyFormat = (command, value = null) => {
        document.execCommand(command, false, value);
        handleInput();
    };

    return (
        <div className="custom-editor-container">
            <div className="custom-editor-toolbar">
                <button type="button" onClick={() => applyFormat('bold')} title="Bold">
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => applyFormat('italic')} title="Italic">
                    <em>I</em>
                </button>
                <button type="button" onClick={() => applyFormat('underline')} title="Underline">
                    <u>U</u>
                </button>
                <select 
                    onChange={(e) => applyFormat('formatBlock', e.target.value)}
                    title="Format"
                >
                    <option value="">Format</option>
                    <option value="<h1>">Heading 1</option>
                    <option value="<h2>">Heading 2</option>
                    <option value="<h3>">Heading 3</option>
                    <option value="<p>">Paragraph</option>
                </select>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} title="Bullet List">
                    • List
                </button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} title="Numbered List">
                    1. List
                </button>
                <button type="button" onClick={() => applyFormat('justifyLeft')} title="Align Left">
                    ←
                </button>
                <button type="button" onClick={() => applyFormat('justifyCenter')} title="Align Center">
                    ↔
                </button>
                <button type="button" onClick={() => applyFormat('justifyRight')} title="Align Right">
                    →
                </button>
                <button type="button" onClick={() => applyFormat('removeFormat')} title="Clear Formatting">
                    Clear
                </button>
            </div>
            <div
                ref={editorRef}
                className="custom-editor-content"
                contentEditable="true"
                onInput={handleInput}
                style={{ height, minHeight: '100px', overflowY: 'auto' }}
            />
            <style jsx="true">{`
                .custom-editor-container {
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                    font-family: Helvetica, Arial, sans-serif;
                }
                .custom-editor-toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    padding: 8px;
                    background-color: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                }
                .custom-editor-toolbar button, .custom-editor-toolbar select {
                    padding: 5px 10px;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .custom-editor-toolbar button:hover, .custom-editor-toolbar select:hover {
                    background-color: #f0f0f0;
                }
                .custom-editor-content {
                    padding: 10px;
                    background: white;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .custom-editor-content:focus {
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default CustomEditor;
