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
exports.LibreChatInlineCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const librechatClient_1 = require("./librechatClient");
class LibreChatInlineCompletionProvider {
    constructor() {
        this.lastRequestTime = 0;
        this.requestDelay = 1000; // 1 second between requests
    }
    async provideInlineCompletionItems(document, position, context, token) {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastRequestTime < this.requestDelay) {
            return [];
        }
        this.lastRequestTime = now;
        // Don't trigger on every keystroke - only when we have meaningful context
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        // Only trigger when user is writing comments or in specific contexts
        if (!this.shouldTriggerCompletion(linePrefix, context)) {
            return [];
        }
        try {
            const completion = await this.getCompletion(document, position, token);
            if (completion && !token.isCancellationRequested) {
                return [new vscode.InlineCompletionItem(completion)];
            }
        }
        catch (error) {
            console.error('Inline completion error:', error);
        }
        return [];
    }
    shouldTriggerCompletion(linePrefix, context) {
        // Trigger when user starts writing a comment
        if (linePrefix.trim().startsWith('//') || linePrefix.trim().startsWith('/*') || linePrefix.trim().startsWith('#')) {
            return true;
        }
        // Trigger when user is writing a function definition
        const functionKeywords = ['function', 'def ', 'const ', 'let ', 'var ', 'class ', 'interface '];
        if (functionKeywords.some(keyword => linePrefix.includes(keyword))) {
            return true;
        }
        // Trigger when user is in the middle of a method call
        if (linePrefix.includes('.') && !linePrefix.includes(';') && !linePrefix.includes('}')) {
            return true;
        }
        return false;
    }
    async getCompletion(document, position, token) {
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        // Get some context after cursor for better completions
        const textAfterCursor = document.getText(new vscode.Range(position, new vscode.Position(Math.min(position.line + 5, document.lineCount - 1), 0)));
        const prompt = `Complete this code. Return ONLY the code completion without any explanations or additional text. Continue from where the cursor is:

\`\`\`${document.languageId}
${textBeforeCursor}[CURSOR]${textAfterCursor}
\`\`\`

Completion:`;
        try {
            const response = await librechatClient_1.LibreChatClient.sendMessage(prompt, {
                fileName: document.fileName,
                language: document.languageId,
                content: textBeforeCursor
            });
            if (token.isCancellationRequested) {
                return '';
            }
            // Extract just the code from the response
            return this.extractCodeFromResponse(response);
        }
        catch (error) {
            console.error('Completion request failed:', error);
            return '';
        }
    }
    extractCodeFromResponse(response) {
        // Remove markdown code blocks if present
        let code = response.replace(/```[\w]*\n?/g, '').trim();
        // Remove any explanatory text that might come after the code
        const lines = code.split('\n');
        const codeLines = [];
        for (const line of lines) {
            // Stop if we encounter explanatory text patterns
            if (line.match(/^(Note:|Explanation:|This code|The above|Here is)/i)) {
                break;
            }
            codeLines.push(line);
        }
        return codeLines.join('\n').trim();
    }
}
exports.LibreChatInlineCompletionProvider = LibreChatInlineCompletionProvider;
//# sourceMappingURL=inlineProvider.js.map