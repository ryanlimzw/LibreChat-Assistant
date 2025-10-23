import * as vscode from 'vscode';
import { LibreChatClient } from './librechatClient';

export class LibreChatPanel {
    public static currentPanel: LibreChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (LibreChatPanel.currentPanel) {
            LibreChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'librechat',
            'LibreChat Assistant',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        LibreChatPanel.currentPanel = new LibreChatPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the initial content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (data) => {
                switch (data.type) {
                    case 'sendMessage':
                        await this._handleSendMessage(data.message);
                        break;
                    case 'getFileContext':
                        await this._handleGetFileContext();
                        break;
                    case 'explainCode':
                        await this._handleExplainCode(data.code);
                        break;
                    case 'showError':
                        vscode.window.showErrorMessage(data.message);
                        break;
                    case 'showInfo':
                        vscode.window.showInformationMessage(data.message);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleSendMessage(message: string) {
        try {
            // Get current file context if enabled
            let context = {};
            const config = vscode.workspace.getConfiguration('librechatAssistant');
            const autoAttach = config.get('autoAttachContext') as boolean;
            
            if (autoAttach) {
                context = await this._getCurrentFileContext();
            }

            // Send message to LibreChat
            const response = await LibreChatClient.sendMessage(message, context);
            
            // Send response back to webview
            this._panel.webview.postMessage({
                type: 'messageResponse',
                content: response
            });
        } catch (error) {
            this._panel.webview.postMessage({
                type: 'error',
                content: 'Failed to send message: ' + error
            });
        }
    }

    private async _handleGetFileContext() {
        const context = await this._getCurrentFileContext();
        this._panel.webview.postMessage({
            type: 'fileContext',
            content: context
        });
    }

    private async _handleExplainCode(code: string) {
        try {
            const response = await LibreChatClient.sendMessage(
                `Please explain this code:\n\n${code}`,
                {}
            );
            
            this._panel.webview.postMessage({
                type: 'explanationResponse',
                content: response
            });
        } catch (error) {
            this._panel.webview.postMessage({
                type: 'error',
                content: 'Failed to get explanation: ' + error
            });
        }
    }

    private async _getCurrentFileContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return { error: 'No active editor' };
        }

        const document = editor.document;
        const config = vscode.workspace.getConfiguration('librechatAssistant');
        const maxLines = config.get('maxContextLines') as number;

        let content = document.getText();
        const lines = content.split('\n');
        
        // Limit content if it's too long
        if (lines.length > maxLines) {
            content = lines.slice(0, maxLines).join('\n') + `\n\n... (${lines.length - maxLines} more lines)`;
        }

        return {
            fileName: document.fileName.split('/').pop(),
            language: document.languageId,
            content: content,
            selection: editor.selection.isEmpty ? undefined : {
                start: editor.selection.start.line,
                end: editor.selection.end.line
            }
        };
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'LibreChat Assistant';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <title>LibreChat Assistant</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 16px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                #chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    max-height: 100%;
                }

                #messages {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 16px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 12px;
                    background-color: var(--vscode-input-background);
                }

                .message {
                    margin-bottom: 12px;
                    padding: 8px;
                    border-radius: 4px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .user-message {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    margin-left: 20%;
                }

                .assistant-message {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    margin-right: 20%;
                }

                .system-message {
                    background-color: var(--vscode-textBlockQuote-background);
                    border-left: 3px solid var(--vscode-textBlockQuote-border);
                    margin: 8px 0;
                    padding: 8px;
                    font-size: 0.9em;
                }

                #input-area {
                    display: flex;
                    gap: 8px;
                }

                #message-input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    resize: vertical;
                    min-height: 60px;
                    font-family: inherit;
                }

                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    font-family: inherit;
                }

                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .toolbar {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }

                .code-block {
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    margin: 8px 0;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    overflow-x: auto;
                }

                .typing-indicator {
                    display: inline-block;
                    margin-left: 8px;
                }

                .typing-dot {
                    display: inline-block;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background-color: var(--vscode-descriptionForeground);
                    margin: 0 1px;
                    animation: typing-bounce 1.3s linear infinite;
                }

                .typing-dot:nth-child(2) {
                    animation-delay: 0.15s;
                }

                .typing-dot:nth-child(3) {
                    animation-delay: 0.3s;
                }

                @keyframes typing-bounce {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-4px);
                    }
                }
            </style>
        </head>
        <body>
            <div id="chat-container">
                <div class="toolbar">
                    <button id="attach-context">Attach Current File</button>
                    <button id="clear-chat">Clear Chat</button>
                    <button id="explain-code">Explain Selected Code</button>
                    <button id="optimize-code">Optimize Selected Code</button>
                </div>
                
                <div id="messages">
                    <div class="message assistant-message">
                        👋 Hello! I'm your LibreChat Assistant. I can help you with:
                        • Code explanations and debugging
                        • Code optimization and suggestions
                        • Answering programming questions
                        • Inline completions as you type
                        
                        How can I help you with your code today?
                    </div>
                </div>

                <div id="input-area">
                    <textarea 
                        id="message-input" 
                        placeholder="Ask me anything about your code... (Ctrl+Enter to send)" 
                        rows="3"
                    ></textarea>
                    <button id="send-button">Send</button>
                </div>
            </div>

            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                const messagesContainer = document.getElementById('messages');
                const messageInput = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
                const attachContextButton = document.getElementById('attach-context');
                const clearChatButton = document.getElementById('clear-chat');
                const explainCodeButton = document.getElementById('explain-code');
                const optimizeCodeButton = document.getElementById('optimize-code');

                let isWaitingForResponse = false;

                sendButton.addEventListener('click', sendMessage);
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        sendMessage();
                    }
                });

                attachContextButton.addEventListener('click', () => {
                    vscode.postMessage({ type: 'getFileContext' });
                });

                clearChatButton.addEventListener('click', () => {
                    messagesContainer.innerHTML = '<div class="message assistant-message">Chat cleared. How can I help you?</div>';
                });

                explainCodeButton.addEventListener('click', () => {
                    vscode.postMessage({ type: 'explainCode', code: getSelectedText() });
                });

                optimizeCodeButton.addEventListener('click', () => {
                    const code = getSelectedText();
                    if (code) {
                        vscode.postMessage({ 
                            type: 'sendMessage', 
                            message: 'Please optimize this code:\\n\\n' + code 
                        });
                    }
                });

                function getSelectedText() {
                    return '';
                }

                function sendMessage() {
                    const message = messageInput.value.trim();
                    if (!message || isWaitingForResponse) return;

                    addMessage(message, 'user');
                    messageInput.value = '';
                    showTypingIndicator();
                    vscode.postMessage({ type: 'sendMessage', message: message });
                }

                function addMessage(content, sender) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message ' + sender + '-message';
                    
                    const formattedContent = content.replace(/\`\`\`(\\w+)?\\n([\\s\\S]*?)\`\`\`/g, '<div class="code-block">$2</div>');
                    messageElement.innerHTML = formattedContent;
                    
                    messagesContainer.appendChild(messageElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }

                function showTypingIndicator() {
                    isWaitingForResponse = true;
                    const typingElement = document.createElement('div');
                    typingElement.className = 'message assistant-message';
                    typingElement.id = 'typing-indicator';
                    typingElement.innerHTML = 'Thinking<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
                    messagesContainer.appendChild(typingElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }

                function hideTypingIndicator() {
                    isWaitingForResponse = false;
                    const typingElement = document.getElementById('typing-indicator');
                    if (typingElement) {
                        typingElement.remove();
                    }
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'messageResponse':
                            hideTypingIndicator();
                            addMessage(message.content, 'assistant');
                            break;
                        case 'fileContext':
                            hideTypingIndicator();
                            if (message.content.error) {
                                addMessage('Unable to attach file context: ' + message.content.error, 'system');
                            } else {
                                addMessage('📎 Attached: ' + message.content.fileName + ' (' + message.content.language + ')', 'system');
                            }
                            break;
                        case 'error':
                            hideTypingIndicator();
                            addMessage('❌ Error: ' + message.content, 'system');
                            break;
                        case 'explanationResponse':
                            hideTypingIndicator();
                            addMessage('💡 Explanation:\\n\\n' + message.content, 'assistant');
                            break;
                    }
                });

                messageInput.focus();
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        LibreChatPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static async explainCode(code: string, extensionUri: vscode.Uri) {
        this.createOrShow(extensionUri);
        // Add a small delay to ensure the panel is created
        setTimeout(() => {
            if (this.currentPanel) {
                this.currentPanel._panel.webview.postMessage({
                    type: 'explainCode',
                    code: code
                });
            }
        }, 100);
    }

    public static async debugCode(code: string, extensionUri: vscode.Uri, diagnostics?: vscode.Diagnostic[]) {
        this.createOrShow(extensionUri);
        setTimeout(() => {
            if (this.currentPanel) {
                let message = `Please help me debug this code:\n\n${code}`;
            
                if (diagnostics && diagnostics.length > 0) {
                    const diagnosticMessages = diagnostics.map(d => 
                        `Line ${d.range.start.line + 1}: ${d.message}`
                    ).join('\n');
                    message += `\n\nCurrent errors:\n${diagnosticMessages}`;
                }

                this.currentPanel._panel.webview.postMessage({
                    type: 'sendMessage',
                    message: message
                });
            }
        }, 100);
    }


    public static async optimizeCode(code: string, extensionUri: vscode.Uri) {
        this.createOrShow(extensionUri);
        setTimeout(() => {
            if (this.currentPanel) {
                this.currentPanel._panel.webview.postMessage({
                    type: 'sendMessage',
                    message: `Please optimize this code:\n\n${code}`
                });
            }
        }, 100);
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}