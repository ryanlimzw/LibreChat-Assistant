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
exports.LibreChatCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class LibreChatCodeActionProvider {
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        // Only provide actions if there's selected text or diagnostics
        const hasSelection = !range.isEmpty;
        const hasDiagnostics = context.diagnostics.length > 0;
        if (!hasSelection && !hasDiagnostics) {
            return actions;
        }
        // Add "Explain this code" action
        if (hasSelection) {
            const explainAction = new vscode.CodeAction('🧠 Explain with LibreChat', vscode.CodeActionKind.QuickFix);
            explainAction.command = {
                command: 'librechat.explainCode',
                title: 'Explain with LibreChat',
                arguments: [document.getText(range)]
            };
            actions.push(explainAction);
        }
        // Add "Optimize this code" action
        if (hasSelection) {
            const optimizeAction = new vscode.CodeAction('⚡ Optimize with LibreChat', vscode.CodeActionKind.Refactor);
            optimizeAction.command = {
                command: 'librechat.optimizeCode',
                title: 'Optimize with LibreChat',
                arguments: [document.getText(range)]
            };
            actions.push(optimizeAction);
        }
        // Add "Debug this code" action if there are diagnostics
        if (hasDiagnostics) {
            const debugAction = new vscode.CodeAction('🐛 Debug with LibreChat', vscode.CodeActionKind.QuickFix);
            debugAction.command = {
                command: 'librechat.debugCode',
                title: 'Debug with LibreChat',
                arguments: [document.getText(), context.diagnostics]
            };
            actions.push(debugAction);
            // Add quick fix for individual errors
            context.diagnostics.forEach((diagnostic, index) => {
                if (index < 3) { // Limit to first 3 errors to avoid clutter
                    const fixAction = new vscode.CodeAction(`🔧 Fix: ${diagnostic.message}`, vscode.CodeActionKind.QuickFix);
                    fixAction.diagnostics = [diagnostic];
                    fixAction.command = {
                        command: 'librechat.debugCode',
                        title: 'Fix with LibreChat',
                        arguments: [document.getText(diagnostic.range), [diagnostic]]
                    };
                    actions.push(fixAction);
                }
            });
        }
        // Add "Generate tests" action for functions/classes
        if (hasSelection) {
            const selectedText = document.getText(range);
            if (this.looksLikeFunctionOrClass(selectedText)) {
                const testAction = new vscode.CodeAction('🧪 Generate tests with LibreChat', vscode.CodeActionKind.QuickFix);
                testAction.command = {
                    command: 'librechat.openChat',
                    title: 'Generate tests with LibreChat'
                };
                // This would need additional handling in the chat panel
                actions.push(testAction);
            }
        }
        return actions;
    }
    looksLikeFunctionOrClass(text) {
        const functionPatterns = [
            /function\s+\w+\s*\(/,
            /def\s+\w+\s*\(/,
            /class\s+\w+/,
            /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
            /let\s+\w+\s*=\s*\([^)]*\)\s*=>/,
            /var\s+\w+\s*=\s*\([^)]*\)\s*=>/
        ];
        return functionPatterns.some(pattern => pattern.test(text));
    }
}
exports.LibreChatCodeActionProvider = LibreChatCodeActionProvider;
LibreChatCodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.QuickFix
];
//# sourceMappingURL=codeActionProvider.js.map