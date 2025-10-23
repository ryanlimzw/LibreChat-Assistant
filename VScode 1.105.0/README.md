# LibreChat Assistant VS Code Extension

A powerful AI coding assistant that integrates LibreChat Enterprise directly into VS Code.

## Features

- **🤖 AI-Powered Chat**: Chat with LibreChat directly in VS Code
- **💻 Code Awareness**: Automatically sees your current file and code context
- **🚀 Inline Completions**: Get AI suggestions as you type (Copilot-like)
- **🔧 Smart Code Actions**: Right-click for explanations, debugging, and optimizations
- **🐛 Debugging Assistant**: Get help with errors and bugs
- **📝 Code Explanations**: Understand complex code with AI explanations

## Setup

1. Install the extension
2. Configure your LibreChat settings:
   - Open VS Code Settings (Ctrl+,)
   - Search for "LibreChat"
   - Set your API URL and API Key

## Usage

### Chat Interface
- Press `Ctrl+Shift+P` and type "Open LibreChat"
- Or use the command palette: "LibreChat: Open Chat"

### Right-Click Actions
- Select code and right-click for:
  - "Explain this code"
  - "Debug this code" 
  - "Optimize this code"

### Inline Completions
- Start typing comments or function definitions
- Get AI-powered code completions automatically

## Configuration

- `librechatAssistant.apiUrl`: Your LibreChat Enterprise instance URL
- `librechatAssistant.apiKey`: Your API key
- `librechatAssistant.autoAttachContext`: Automatically include current file context
- `librechatAssistant.enableInlineCompletions`: Enable/disable inline suggestions

## Requirements

- VS Code 1.74.0 or higher
- LibreChat Enterprise instance with API access
- Internet connection for API calls

## Privacy

- Your code is only sent to your company's LibreChat instance
- No data is stored by the extension
- All communication uses your configured API endpoints