import { Editor } from '@tinymce/tinymce-react';
import { useRef, useState, useEffect } from 'react';
import API_BASE from '../../config/api';

const QuestionEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const [apiKey, setApiKey] = useState('');
    const fetchApiKey = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/action/update-keys`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error('Fetch API key error:', errorMessage);
                throw new Error('Failed to fetch API key');
            }

            const keys = await response.json();
            const listeningKey = keys.find(key => key.type === 'reading' && key.is_active);
            if (listeningKey) {
                setApiKey(listeningKey.key);
            }
            console.log('API Key:', listeningKey.key);
        } catch (error) {
            console.error('Error fetching API key:', error);
            toast.error('Failed to fetch API key');
        }
    };
    useEffect(() => {
        fetchApiKey();
    }, []);
    return (
        <Editor
            apiKey="x8qv7w0pkk74iqgmg44vcmclaec708cuu838bb4jx28o26ur"
            onInit={(evt, editor) => editorRef.current = editor}
            onEditorChange={onChange}
            value={value}
            init={{
                height: '100%',
                menubar: false,
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                    'noneditable'
                ],
                toolbar: [
                    'undo redo | blocks | fontsize | bold italic | alignleft aligncenter alignright alignjustify',
                    'bullist numlist | outdent indent | checkbox radio textfield | image sidebyside | ieltstable | dragdrop | headingdrop | reformat | separator',
                    'removeformat | help'
                ],
                fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 36pt',
                images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        reject('Failed to read file');
                    };
                    reader.readAsDataURL(blobInfo.blob());
                }),
                setup: (editor) => {
                    // Add re-format button
                    editor.ui.registry.addButton('reformat', {
                        text: 'Re-format',
                        tooltip: 'Re-format selected text to Calibri 12pt',
                        onAction: () => {
                            editor.execCommand('fontName', false, 'Calibri');
                            editor.execCommand('fontSize', false, '12pt');
                        }
                    });
                    // Enhanced checkbox button
                    editor.ui.registry.addButton('checkbox', {
                        text: '☐ Checkbox',
                        tooltip: 'Insert checkbox',
                        onAction: () => {
                            editor.insertContent('<input type="checkbox" class="ielts-checkbox" /> ');
                        }
                    });
                    editor.ui.registry.addButton('ieltstable', {
                        text: 'Ielts table',
                        tooltip: 'Insert Ielts tab',
                        onAction: () => {
                            editor.windowManager.open({
                                title: 'Insert IELTS Table',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'input',
                                            name: 'questionCount',
                                            label: 'Number of Questions',
                                            inputMode: 'numeric'
                                        },
                                        {
                                            type: 'input',
                                            name: 'answerCount',
                                            label: 'Number of Answers per Question',
                                            inputMode: 'numeric'
                                        }
                                    ]
                                },
                                buttons: [
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    },
                                    {
                                        type: 'submit',
                                        text: 'Insert',
                                        primary: true
                                    }
                                ],
                                onSubmit: (api) => {
                                    const data = api.getData();
                                    const questionCount = parseInt(data.questionCount) || 6;
                                    const answerCount = parseInt(data.answerCount) || 4;

                                    // Generate table HTML
                                    let tableHtml = '<table style="width:100%; border-collapse: collapse; margin: 10px 0;">';

                                    // Header row
                                    tableHtml += '<tr><th style="border: 1px solid #ddd; padding: 8px;">Question</th>';
                                    for (let i = 0; i < answerCount; i++) {
                                        tableHtml += `<th style="border: 1px solid #ddd; padding: 8px;">${String.fromCharCode(65 + i)}</th>`;
                                    }
                                    tableHtml += '</tr>';

                                    for (let i = 1; i <= questionCount; i++) {
                                        const groupName = 'radiogroup_' + Math.floor(Math.random() * 10000); // Ensure unique group name for each question
                                        tableHtml += '<tr>';
                                        tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">${i} Enter your question here.</td>`;
                                        for (let j = 0; j < answerCount; j++) {
                                            tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            <input type="radio" name="${groupName}" value="${String.fromCharCode(65 + j)}" class="ielts-radio" style="margin: 0;">
        </td>`;
                                        }
                                        tableHtml += '</tr>';
                                    }
                                    // ... existing code ...
                                    tableHtml += '</table>';

                                    // Insert the table
                                    editor.insertContent(tableHtml);
                                    api.close();
                                }
                            });
                        }
                    });
                    // Enhanced radio button
                    editor.ui.registry.addButton('radio', {
                        text: '○ Radio',
                        tooltip: 'Insert radio button',
                        onAction: () => {
                            const groupName = 'radiogroup_' + Math.floor(Math.random() * 10000);
                            editor.insertContent(`<input type="radio" name="${groupName}" class="ielts-radio" /> `);
                        }
                    });
                    editor.ui.registry.addButton('headingdrop', {
                        text: 'Heading Drop',
                        onAction: () => {
                            editor.windowManager.open({
                                title: 'Create Heading Matching Exercise',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'textarea',
                                            name: 'headings',
                                            label: 'Headings (one per line)',
                                            placeholder: 'Enter headings, one per line'
                                        },

                                    ]
                                },
                                buttons: [
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    },
                                    {
                                        type: 'submit',
                                        text: 'Generate',
                                        primary: true
                                    }
                                ],
                                onSubmit: (api) => {
                                    const data = api.getData();
                                    const headings = data.headings.split('\n').filter(heading => heading.trim());

                                    // Shuffle headings if requested
                                    let displayHeadings = [...headings];

                                    // Create heading list with appropriate markers
                                    let headingsHtml = '<div class="ielts-heading-match" style="margin: 10px 0; padding: 15px;">';
                                    headingsHtml += '<h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #333;">Paragraph Headings</h3>';
                                    headingsHtml += '<div style="display: flex; flex-direction: column;">';

                                    displayHeadings.forEach((heading, index) => {

                                        headingsHtml += `

                                        <div class="ielts-heading-option" data-heading-id="${index + 1}" style="display: flex; align-items: center; margin-bottom: 8px;">
                                            <div style="width: fit-content; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 4px 8px;">${heading}</div>
                                        </div>`;

                                    });

                                    headingsHtml += '</div>';
                                    headingsHtml += '</div>';

                                    // Insert the headings container
                                    editor.insertContent(headingsHtml);
                                    api.close();
                                }
                            });
                        }
                    });

                    editor.ui.registry.addButton('dragdrop', {
                        text: 'Drag & Drop',
                        onAction: () => {
                            editor.windowManager.open({
                                title: 'Create Drag & Drop Question',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'textarea',
                                            name: 'article',
                                            label: 'Article Text',
                                            placeholder: 'Enter your article text. Use "..........." (dots) to indicate drop zones.'
                                        },
                                        {
                                            type: 'textarea',
                                            name: 'answers',
                                            label: 'Answers (one per line)',
                                            placeholder: 'Enter answers, one per line'
                                        }
                                    ]
                                },
                                buttons: [
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    },
                                    {
                                        type: 'submit',
                                        text: 'Insert',
                                        primary: true
                                    }
                                ],
                                onSubmit: (api) => {
                                    const data = api.getData();
                                    const answers = data.answers.split('\n').filter(answer => answer.trim());
                                    let article = data.article;

                                    // Replace dots with drop zones
                                    let dropIndex = 0;
                                    article = article.replace(/\.{3,}/g, (match) => {
                                        dropIndex++;
                                        return `<div class="ielts-drop-zone" data-index="${dropIndex}" contenteditable="false" style="display: inline-block; min-width: 100px; height: 24px; border: 2px dashed #ccc; background: #f0f0f0; margin: 0 4px;"></div>`;
                                    });

                                    // Create draggable answers
                                    let answersHtml = '<div class="ielts-answers" style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; background: #f8f8f8;">';
                                    answers.forEach((answer, index) => {
                                        answersHtml += `<div class="ielts-drag-item" draggable="true" data-answer="${index + 1}" style="display: inline-block; padding: 4px 8px; margin: 4px; background: #fff; border: 1px solid #ddd; cursor: move;">${answer}</div>`;
                                    });
                                    answersHtml += '</div>';

                                    // Insert the complete question
                                    editor.insertContent(`
                                                                <div class="ielts-dragdrop-question" style="margin: 20px 0;">
                                                                    <div class="ielts-article">${article}</div>
                                                                    ${answersHtml}
                                                                </div>
                                                            `);

                                    api.close();
                                }
                            });
                        }
                    });
                    // Add question separator button
                    editor.ui.registry.addButton('separator', {
                        text: 'Add Separator',
                        tooltip: 'Insert question separator',
                        onAction: () => {
                            editor.insertContent('<div class="question-separator"></div>');
                        }
                    });

                    // New text field button
                    editor.ui.registry.addButton('textfield', {
                        text: '▭ Text Field',
                        tooltip: 'Insert text field',
                        onAction: () => {
                            editor.insertContent('<input type="text" class="ielts-textfield" value="Number" style="width: 60px; height: 25px; border: 1px solid #999; border-radius: 3px; padding: 4px 8px; margin: 0 4px; font-weight: bold; text-align: center;" /> ');
                        }
                    });

                    // Add a menu button for more form elements
                    editor.ui.registry.addMenuButton('formfields', {
                        text: 'Form Fields',
                        fetch: (callback) => {
                            const items = [
                                {
                                    type: 'menuitem',
                                    text: 'Short Answer Field',
                                    onAction: () => editor.insertContent('<input type="text" class="ielts-shortanswer" style="width: 100px; border-bottom: 1px solid #999;" />')
                                },
                                {
                                    type: 'menuitem',
                                    text: 'Number Field',
                                    onAction: () => editor.insertContent('<input type="number" class="ielts-number" min="0" max="100" style="width: 60px; border: 1px solid #ddd; border-radius: 3px;" />')
                                },
                                {
                                    type: 'menuitem',
                                    text: 'Dropdown',
                                    onAction: () => {
                                        const html = `
                                                            <select class="ielts-select" style="border: 1px solid #ddd; border-radius: 3px; padding: 2px;">
                                                                <option value="">Select...</option>
                                                                <option value="option1">Option 1</option>
                                                                <option value="option2">Option 2</option>
                                                                <option value="option3">Option 3</option>
                                                            </select>
                                                            `;
                                        editor.insertContent(html);
                                    }
                                }
                            ];
                            callback(items);
                        }
                    });
                },
                content_style: `
    body { font-family:Helvetica,Arial,sans-serif; font-size:12pt }
    .question-separator { border-top: 2px solid #e5e7eb; margin: 1.5rem 0; position: relative; }
    .question-separator::before { content: 'Question Separator'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background-color: white; padding: 0 10px; color: #6b7280; font-size: 14px; }
    input[type="checkbox"].ielts-checkbox { margin-right: 5px; transform: scale(1.2); }
    input[type="radio"].ielts-radio { margin-right: 5px; transform: scale(1.2); }
    input[type="text"].ielts-textfield { 
        display: inline-block;
        background: white;
        border: 1px solid #999;
        border-radius: 3px;
        padding: 4px 8px;
        outline: none;
        width: 80px;
        height: 30px;
        font-weight: bold;
        text-align: center;
    }
    input[type="text"].ielts-textfield:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
    }
    .ielts-heading-match {
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .ielts-heading-option {
        transition: transform 0.2s ease;
    }
    .ielts-heading-option:hover {
        transform: translateX(5px);
    }
    .ielts-heading-option > div:last-child {
        transition: box-shadow 0.2s ease;
    }
    .ielts-heading-option:hover > div:last-child {
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .image-question-container {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;
    }
    .image-container {
        margin-right: 15px;
    }
    .question-container {
        flex: 1;
    }
    `
            }}

        />
    );
};

export default QuestionEditor;
