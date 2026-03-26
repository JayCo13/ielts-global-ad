import React, { useRef, useEffect, useState } from 'react';
import { Bold } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, className }) => {
    const editorRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    // Update the editor content when the value prop changes
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);
    
    // Add event listeners for selection changes
    useEffect(() => {
        const handleSelectionChange = () => {
            updateToolbarState();
        };
        
        document.addEventListener('selectionchange', handleSelectionChange);
        
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    // Handle content changes and call the onChange prop
    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
            updateToolbarState();
        }
    };
    
    // Update toolbar button states based on current selection
    const updateToolbarState = () => {
        // Only update if this editor is focused
        if (document.activeElement === editorRef.current) {
            const isBold = document.queryCommandState('bold');
            // Get the parent rich-text-editor div and find the bold button within it
            const editorContainer = editorRef.current.closest('.rich-text-editor');
            if (editorContainer) {
                const boldButton = editorContainer.querySelector('.bold-button');
                if (boldButton) {
                    if (isBold) {
                        boldButton.classList.add('active-format');
                    } else {
                        boldButton.classList.remove('active-format');
                    }
                }
            }
        }
    };

    // Handle the bold button click
    const handleBold = (e) => {
        e.preventDefault();
        // Focus the editor first to ensure commands apply to this editor only
        editorRef.current.focus();
        // Execute the bold command
        document.execCommand('bold', false, null);
        handleInput();
    };
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        // Bold: Ctrl+B or Cmd+B
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            // Make sure this editor has focus before applying the command
            if (document.activeElement !== editorRef.current) {
                editorRef.current.focus();
            }
            document.execCommand('bold', false, null);
            handleInput();
        }
    };

    // Handle paste event to preserve formatting
    const handlePaste = (e) => {
        e.preventDefault();
        
        // Get clipboard data as HTML
        const clipboardData = e.clipboardData || window.clipboardData;
        let pastedData;
        
        // Try to get HTML content first
        if (clipboardData.getData('text/html')) {
            pastedData = clipboardData.getData('text/html');
            
            // Create a temporary element to clean the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pastedData;
            
            // Keep only the allowed tags (like <b>, <strong>, etc.)
            const cleanHTML = sanitizeHTML(tempDiv);
            pastedData = cleanHTML;
        } else {
            // Fallback to plain text
            pastedData = clipboardData.getData('text/plain');
        }
        
        // Insert the content at cursor position
        document.execCommand('insertHTML', false, pastedData);
        handleInput();
    };
    
    // Function to sanitize HTML and keep only allowed formatting
    const sanitizeHTML = (element) => {
        // Define allowed tags
        const allowedTags = ['B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'DIV', 'SPAN'];
        
        // Process all child nodes recursively
        const childNodes = Array.from(element.childNodes);
        
        childNodes.forEach(node => {
            // If it's an element node
            if (node.nodeType === 1) {
                // Check if the tag is allowed
                if (!allowedTags.includes(node.nodeName)) {
                    // Replace with its text content
                    const text = document.createTextNode(node.textContent);
                    node.parentNode.replaceChild(text, node);
                } else {
                    // Recursively process children
                    sanitizeHTML(node);
                }
            }
        });
        
        return element.innerHTML;
    };

    return (
        <div className="rich-text-editor">
            <div className="toolbar flex items-center space-x-2 mb-1">
                <button 
                    onClick={handleBold}
                    className="bold-button p-1 rounded hover:bg-gray-200 focus:outline-none"
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
            </div>
            <style jsx="true">{`
                .active-format {
                    background-color: #e5e7eb;
                    color: #1d4ed8;
                }
            `}</style>
            <div 
                ref={editorRef}
                contentEditable="true"
                className={`${className} min-h-[72px] overflow-auto ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    handleInput();
                }}
                data-placeholder={placeholder}
                style={{
                    position: 'relative',
                }}
            />
            <style jsx="true">{`
                [contenteditable=true]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    position: absolute;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
