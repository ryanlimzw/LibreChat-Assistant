import * as vscode from 'vscode';
import { LibreChatPanel } from './librechatPanel';
import { LibreChatClient } from './librechatClient';
import { LibreChatInlineCompletionProvider } from './inlineProvider';
import { LibreChatCodeActionProvider } from './codeActionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('LibreChat Assistant extension is now active!');

    // Initialize the LibreChat client with configuration
    const config = vscode.workspace.getConfiguration('librechatAssistant');
    const apiUrl = config.get('apiUrl') as string;
    const apiKey = config.get('apiKey') as string;

    if (apiUrl && apiKey) {
        LibreChatClient.initialize({ baseUrl: apiUrl, apiKey });
    } else {
        vscode.window.showWarningMessage(
            'LibreChat Assistant: Please configure API URL and Key in settings.'
        );
    }

    // Register inline completion provider if enabled
    const enableInlineCompletions = config.get('enableInlineCompletions', true);
    let disposableInline: vscode.Disposable | undefined;
    if (enableInlineCompletions) {
        const inlineProvider = new LibreChatInlineCompletionProvider();
        disposableInline = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            inlineProvider
        );
    }

    // Register code action provider
    const codeActionProvider = new LibreChatCodeActionProvider();
    const disposableCodeActions = vscode.languages.registerCodeActionsProvider(
        { pattern: '**' },
        codeActionProvider,
        {
            providedCodeActionKinds: LibreChatCodeActionProvider.providedCodeActionKinds
        }
    );

    // Register command to open the main chat panel
    const openChatCommand = vscode.commands.registerCommand('librechat.openChat', () => {
        LibreChatPanel.createOrShow(context.extensionUri);
    });

    // Register command to explain selected code
    const explainCodeCommand = vscode.commands.registerCommand('librechat.explainCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found! Please open a file first.');
            return;
        }

        const selection = editor.selection;
        const text = selection.isEmpty ? 
            editor.document.getText() : 
            editor.document.getText(selection);

        LibreChatPanel.explainCode(text, context.extensionUri);
    });

    // Register command to debug code
    const debugCodeCommand = vscode.commands.registerCommand('librechat.debugCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found! Please open a file first.');
            return;
        }

        const text = editor.document.getText();
        LibreChatPanel.debugCode(text, context.extensionUri);
    });

    // Register command to optimize code
    const optimizeCodeCommand = vscode.commands.registerCommand('librechat.optimizeCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found! Please open a file first.');
            return;
        }

        const selection = editor.selection;
        const text = selection.isEmpty ? 
            editor.document.getText() : 
            editor.document.getText(selection);

        LibreChatPanel.optimizeCode(text, context.extensionUri);
    });

    // Add all to subscriptions
    const subscriptions: vscode.Disposable[] = [
        openChatCommand,
        explainCodeCommand,
        debugCodeCommand,
        optimizeCodeCommand,
        disposableCodeActions
    ];

    if (disposableInline) {
        subscriptions.push(disposableInline);
    }

    context.subscriptions.push(...subscriptions);

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('librechatAssistant')) {
            const config = vscode.workspace.getConfiguration('librechatAssistant');
            const apiUrl = config.get('apiUrl') as string;
            const apiKey = config.get('apiKey') as string;
            
            if (apiUrl && apiKey) {
                LibreChatClient.initialize({ baseUrl: apiUrl, apiKey });
                vscode.window.showInformationMessage('LibreChat configuration updated!');
            }
        }
    });
}

export function deactivate() {}