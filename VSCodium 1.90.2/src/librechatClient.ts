import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export class LibreChatClient {
    private static baseUrl: string = '';
    private static apiKey: string = '';
    private static isInitialized = false;

    public static initialize(config: { baseUrl: string; apiKey: string }) {
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.isInitialized = true;
    }

    public static async sendMessage(message: string, context: any = {}): Promise<string> {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }

        return this.makeRequest('/api/v1/messages', {
            message: message,
            context: context
        });
    }

    public static async getModels(): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }

        return this.makeRequest('/api/v1/models', null, 'GET');
    }

    public static async getConversations(): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('Please configure LibreChat first');
        }

        return this.makeRequest('/api/v1/conversations', null, 'GET');
    }

    private static async makeRequest(
        endpoint: string, 
        payload: any = null, 
        method: string = 'POST'
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            const isHttps = url.protocol === 'https:';
            
            const payloadString = payload ? JSON.stringify(payload) : '';
            
            const options: http.RequestOptions = {
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
                        } catch (error) {
                            // If JSON parsing fails, return raw data
                            resolve(data);
                        }
                    } else {
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

    public static isConfigured(): boolean {
        return this.isInitialized && this.baseUrl !== '' && this.apiKey !== '';
    }

    public static getConfiguration(): { baseUrl: string; apiKey: string } {
        return {
            baseUrl: this.baseUrl,
            apiKey: this.apiKey
        };
    }

    public static reset() {
        this.baseUrl = '';
        this.apiKey = '';
        this.isInitialized = false;
    }
}