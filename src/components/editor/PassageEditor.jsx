import { Editor } from '@tinymce/tinymce-react';
import { useRef, useState, useEffect } from 'react';
import API_BASE from '../../config/api';

const PassageEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const [apiKey, setApiKey] = useState('');
    const showLayoutDialog = (editor) => {
        editor.windowManager.open({
            title: 'Choose Layout Template',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'selectbox',
                        name: 'layout',
                        label: 'Select Layout',
                        items: [
                            { value: 'standard', text: 'Standard Reading Layout' },
                            { value: 'two_column', text: 'Two Column Layout' },
                            { value: 'title_subtitle', text: 'Title with Subtitle' },
                            { value: 'remove', text: 'Remove Layout' }
                        ]
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
                    text: 'Apply',
                    primary: true
                }
            ],
            onSubmit: (api) => {
                const data = api.getData();
                applyLayout(editor, data.layout);
                api.close();
            }
        });
    };
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
    const applyLayout = (editor, layoutType) => {
        let template = '';
        switch (layoutType) {
            case 'standard':
                template = `<h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Enter Passage Title</h1>\n<p style="margin-bottom: 15px; line-height: 1.5;">Enter your passage content here...</p>`;
                break;
            case 'two_column':
                template = `<div style="display: flex; gap: 20px;">\n<div style="flex: 1;">\n<p style="margin-bottom: 15px; line-height: 1.5;">Left column content...</p>\n</div>\n<div style="flex: 1;">\n<p style="margin-bottom: 15px; line-height: 1.5;">Right column content...</p>\n</div>\n</div>`;
                break;
            case 'title_subtitle':
                template = `<h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Enter Main Title</h1>\n<p style="text-align: center; font-style: italic; margin-bottom: 20px;">Enter Subtitle</p>\n<p style="margin-bottom: 15px; line-height: 1.5;">Enter your passage content here...</p>`;
                break;
            case 'remove':
                // Get the selected content or all content if nothing is selected
                const content = editor.selection.getContent() || editor.getContent();
                // Remove any layout-specific elements and styles
                const cleanContent = content
                    .replace(/<div[^>]*style="[^"]*display:\s*flex[^"]*"[^>]*>[\s\S]*?<\/div>/g, '$1') // Remove flex containers
                    .replace(/<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>(.*?)<\/h1>/g, '$1') // Remove centered headings
                    .replace(/<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>(.*?)<\/p>/g, '$1') // Remove centered paragraphs
                    .replace(/<p[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/p>/g, '$1') // Remove italic paragraphs
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                editor.setContent(`<p style="margin-bottom: 15px; line-height: 1.5;">${cleanContent}</p>`);
                return;
            default:
                return;
        }

        // Get cursor position or selection
        const selection = editor.selection.getContent();
        const bookmark = editor.selection.getBookmark();

        // Insert template at cursor position or replace selection
        editor.selection.setContent(template);

        // Restore cursor position if no text was selected
        if (!selection) {
            editor.selection.moveToBookmark(bookmark);
        }
    };

    return (
        <Editor
            apiKey="x8qv7w0pkk74iqgmg44vcmclaec708cuu838bb4jx28o26ur"
            onInit={(evt, editor) => editorRef.current = editor}
            value={value}
            init={{
                height: 400,
                menubar: false,
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'preview', 'searchreplace', 'visualblocks', 'fullscreen',
                    'table', 'wordcount', 'paste'
                ],
                toolbar: [
                    'undo redo | formatselect | fontselect fontsizeselect |',
                    'bold italic underline strikethrough | forecolor backcolor |',
                    'alignleft aligncenter alignright alignjustify | indent outdent |',
                    'bullist numlist | table | removeformat | wordlayout | headingdrop'
                ],
                setup: function (editor) {
                    editor.ui.registry.addButton('headingdrop', {
                        text: 'Add Heading Drop Area',
                        onAction: function () {
                            const timestamp = new Date().getTime();
                            const dropAreaId = `heading-drop-${timestamp}`;
                            const dropArea = `<div style="display: flex;">
                                <div style="display: flex; align-items: center;">
                                    <div id="${dropAreaId}" class="heading-drop-area" style="border: 1px solid #ccc; padding: 8px 12px; background-color: #f9f9f9; min-height: 30px; text-align: center; cursor: pointer; width: 500px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" contenteditable="false">
                                        <p style="color: #666; margin: 0;">Drop Heading Here</p>
                                    </div>
                                </div>
                            </div>`;
                            editor.insertContent(dropArea);
                        }
                    });
                    editor.ui.registry.addSplitButton('wordlayout', {
                        text: 'Layout Templates',
                        onAction: function () {
                            showLayoutDialog(editor);
                        },
                        onItemAction: function (api, value) {
                            applyLayout(editor, value);
                        },
                        fetch: function (callback) {
                            const items = [
                                {
                                    type: 'choiceitem',
                                    text: 'Standard Reading Layout',
                                    value: 'standard'
                                },
                                {
                                    type: 'choiceitem',
                                    text: 'Two Column Layout',
                                    value: 'two_column'
                                },
                                {
                                    type: 'choiceitem',
                                    text: 'Title with Subtitle',
                                    value: 'title_subtitle'
                                },
                                {
                                    type: 'choiceitem',
                                    text: 'Remove Layout',
                                    value: 'remove'
                                }
                            ];
                            callback(items);
                        }
                    });
                },
                font_formats: 'Arial=arial,helvetica,sans-serif; Times New Roman=times new roman,times,serif; Calibri=calibri,sans-serif',
                fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                content_style: '.heading-drop-area { user-select: none; transition: all 0.2s ease; } .heading-drop-area:hover { background-color: #f0f0f0 !important; border-color: #999 !important; }',
                style_formats: [
                    { title: 'Passage Title', block: 'h1', styles: { 'text-align': 'center', 'font-size': '24px', 'margin-bottom': '20px' } },
                    { title: 'Subtitle', block: 'p', styles: { 'text-align': 'center', 'font-style': 'italic', 'margin-bottom': '20px' } },
                    { title: 'Normal Paragraph', block: 'p', styles: { 'margin-bottom': '15px', 'line-height': '1.5' } },
                    { title: 'Indented Paragraph', block: 'p', styles: { 'margin-left': '30px', 'margin-bottom': '15px' } }
                ]
            }}
            onEditorChange={onChange}
        />
    );
};

export default PassageEditor;
