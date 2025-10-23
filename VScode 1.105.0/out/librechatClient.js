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
exports.LibreChatClient = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
class LibreChatClient {
    static initialize(config) {
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.isInitialized = true;
    }
    static async sendMessage(message, context = {}) {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }
        return this.makeRequest('/api/v1/messages', {
            message: message,
            context: context
        });
    }
    static async getModels() {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }
        return this.makeRequest('/api/v1/models', null, 'GET');
    }
    static async getConversations() {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }
        return this.makeRequest('/api/v1/conversations', null, 'GET');
    }
    static async makeRequest(endpoint, payload = null, method = 'POST') {
        return new Promise((resolve, reject) => {
            const url = new url_1.URL(`${this.baseUrl}${endpoint}`);
            const isHttps = url.protocol === 'https:';
            const payloadString = payload ? JSON.stringify(payload) : '';
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                }
            };
            if (payloadString) {
                options.headers = {
                    ...options.headers,
                    'Content-Length': Buffer.byteLength(payloadString)
                };
            }
            const req = (isHttps ? https : http).request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsedData = JSON.parse(data);
                            // Try different possible response fields
                            const responseText = parsedData.message ||
                                parsedData.response ||
                                parsedData.content ||
                                parsedData.text ||
                                JSON.stringify(parsedData);
                            resolve(responseText);
                        }
                        catch (error) {
                            // If JSON parsing fails, return raw data
                            resolve(data);
                        }
                    }
                    else {
                        reject(new Error(`HTTP error! status: ${res.statusCode}, message: ${data}`));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });
            // Set timeout
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout after 30 seconds'));
            });
            if (payloadString) {
                req.write(payloadString);
            }
            req.end();
        });
    }
    static isConfigured() {
        return this.isInitialized && this.baseUrl !== '' && this.apiKey !== '';
    }
    static getConfiguration() {
        return {
            baseUrl: this.baseUrl,
            apiKey: this.apiKey
        };
    }
    static reset() {
        this.baseUrl = '';
        this.apiKey = '';
        this.isInitialized = false;
    }
}
exports.LibreChatClient = LibreChatClient;
LibreChatClient.baseUrl = '';
LibreChatClient.apiKey = '';
LibreChatClient.isInitialized = false;
//# sourceMappingURL=librechatClient.js.map