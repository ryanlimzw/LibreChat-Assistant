"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const librechatPanel_1 = require("./librechatPanel");
const librechatClient_1 = require("./librechatClient");
const inlineProvider_1 = require("./inlineProvider");
const codeActionProvider_1 = require("./codeActionProvider");
function activate(context) {
    console.log('LibreChat Assistant extension is now active!');
    // Initialize the LibreChat client with configuration
    const config = vscode.workspace.getConfiguration('librechatAssistant');
    const apiUrl = config.get('apiUrl');
    const apiKey = config.get('apiKey');
    if (apiUrl && apiKey) {
        librechatClient_1.LibreChatClient.initialize({ baseUrl: apiUrl, apiKey });
    }
    else {
        vscode.window.showWarningMessage('LibreChat Assistant: Please configure API URL and Key in settings.');
    }
    // Register inline completion provider if enabled
    const enableInlineCompletions = config.get('enableInlineCompletions', true);
    let disposableInline;
    if (enableInlineCompletions) {
        const inlineProvider = new inlineProvider_1.LibreChatInlineCompletionProvider();
        disposableInline = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineProvider);
    }
    // Register code action provider
    const codeActionProvider = new codeActionProvider_1.LibreChatCodeActionProvider();
    const disposableCodeActions = vscode.languages.registerCodeActionsProvider({ pattern: '**' }, codeActionProvider, {
        providedCodeActionKinds: codeActionProvider_1.LibreChatCodeActionProvider.providedCodeActionKinds
    });
    // Register command to open the main chat panel
    const openChatCommand = vscode.commands.registerCommand('librechat.openChat', () => {
        librechatPanel_1.LibreChatPanel.createOrShow(context.extensionUri);
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
        librechatPanel_1.LibreChatPanel.explainCode(text, context.extensionUri);
    });
    // Register command to debug code
    const debugCodeCommand = vscode.commands.registerCommand('librechat.debugCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found! Please open a file first.');
            return;
        }
        const text = editor.document.getText();
        librechatPanel_1.LibreChatPanel.debugCode(text, context.extensionUri);
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
        librechatPanel_1.LibreChatPanel.optimizeCode(text, context.extensionUri);
    });
    // Add all to subscriptions
    const subscriptions = [
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
            const apiUrl = config.get('apiUrl');
            const apiKey = config.get('apiKey');
            if (apiUrl && apiKey) {
                librechatClient_1.LibreChatClient.initialize({ baseUrl: apiUrl, apiKey });
                vscode.window.showInformationMessage('LibreChat configuration updated!');
            }
        }
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map