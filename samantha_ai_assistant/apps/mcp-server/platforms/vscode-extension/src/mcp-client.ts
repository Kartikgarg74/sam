import * as vscode from 'vscode';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface MCPCommandResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class MCPClient extends EventEmitter {
    private baseUrl: string;
    private isConnected = false;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        super();
        this.config = vscode.workspace.getConfiguration('samantha-ai');
        this.baseUrl = this.config.get('mcpServerUrl', 'http://localhost:8000');
    }

    public async connect(): Promise<boolean> {
        try {
            // Test connection to MCP server
            const response = await axios.get(`${this.baseUrl}/api/v1/monitoring/health`, {
                timeout: 5000
            });

            if (response.status === 200) {
                this.isConnected = true;
                this.emit('statusChange', 'connected');
                return true;
            } else {
                this.isConnected = false;
                this.emit('statusChange', 'error');
                return false;
            }
        } catch (error) {
            this.isConnected = false;
            this.emit('statusChange', 'error');
            console.error('Failed to connect to MCP server:', error);
            return false;
        }
    }

    public async executeCommand(command: string): Promise<MCPCommandResult> {
        try {
            if (!this.isConnected) {
                const connected = await this.connect();
                if (!connected) {
                    return {
                        success: false,
                        error: 'Not connected to MCP server'
                    };
                }
            }

            // Emit processing status
            this.emit('statusChange', 'processing');

            // Execute command through MCP server
            const response = await axios.post(`${this.baseUrl}/api/v1/automation/execute`, {
                command: command,
                params: {}
            }, {
                timeout: 30000
            });

            // Emit connected status
            this.emit('statusChange', 'connected');

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                    data: response.data.data
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Unknown error'
                };
            }

        } catch (error) {
            this.emit('statusChange', 'error');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    public async processVoiceAudio(audioData: string, language: string = 'en-US'): Promise<MCPCommandResult> {
        try {
            if (!this.isConnected) {
                const connected = await this.connect();
                if (!connected) {
                    return {
                        success: false,
                        error: 'Not connected to MCP server'
                    };
                }
            }

            // Emit processing status
            this.emit('statusChange', 'processing');

            // Process voice audio through MCP server
            const formData = new FormData();
            const audioBlob = new Blob([Buffer.from(audioData, 'base64')], { type: 'audio/wav' });
            formData.append('audio_file', audioBlob, 'audio.wav');
            formData.append('language', language);

            const response = await axios.post(`${this.baseUrl}/api/v1/voice/process-audio`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000
            });

            // Emit connected status
            this.emit('statusChange', 'connected');

            if (response.data.success) {
                return {
                    success: true,
                    message: 'Voice processed successfully',
                    data: response.data.command
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Voice processing failed'
                };
            }

        } catch (error) {
            this.emit('statusChange', 'error');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Voice processing error'
            };
        }
    }

    public async getSystemHealth(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/monitoring/health`);
            return response.data;
        } catch (error) {
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Health check failed'
            };
        }
    }

    public async getSupportedLanguages(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/voice/supported-languages`);
            return response.data.languages || [];
        } catch (error) {
            return ['en-US']; // Default fallback
        }
    }

    public async getSupportedOperations(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/automation/supported-operations`);
            return response.data.operations || [];
        } catch (error) {
            return []; // Empty fallback
        }
    }

    public disconnect(): void {
        this.isConnected = false;
        this.emit('statusChange', 'disconnected');
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    public onStatusChange(callback: (status: string) => void): void {
        this.on('statusChange', callback);
    }
}
