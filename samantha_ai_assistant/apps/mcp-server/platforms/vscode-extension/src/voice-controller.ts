import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { MCPClient } from './mcp-client';

export class VoiceController extends EventEmitter {
    private mcpClient: MCPClient;
    private isRecording = false;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private config: vscode.WorkspaceConfiguration;

    constructor(mcpClient: MCPClient) {
        super();
        this.mcpClient = mcpClient;
        this.config = vscode.workspace.getConfiguration('samantha-ai');
    }

    public async start(): Promise<void> {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Create media recorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Set up event listeners
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                await this.processAudio();
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;

            // Emit status
            this.emit('statusChange', 'recording');

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start voice recording: ${error}`);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        try {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;

                // Stop all tracks
                if (this.mediaRecorder.stream) {
                    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }

                // Emit status
                this.emit('statusChange', 'stopped');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop voice recording: ${error}`);
            throw error;
        }
    }

    private async processAudio(): Promise<void> {
        try {
            if (this.audioChunks.length === 0) {
                return;
            }

            // Combine audio chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.audioChunks = [];

            // Convert to base64
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = Buffer.from(arrayBuffer).toString('base64');

            // Get language from config
            const language = this.config.get('language', 'en-US');

            // Process through MCP server
            const result = await this.mcpClient.processVoiceAudio(base64Audio, language);

            if (result.success && result.data) {
                // Emit the recognized command
                const command = result.data.original_text;
                this.emit('command', command);

                // Show notification
                vscode.window.showInformationMessage(`Recognized: "${command}"`);
            } else {
                vscode.window.showWarningMessage('Could not recognize speech. Please try again.');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process audio: ${error}`);
        }
    }

    public onCommand(callback: (command: string) => void): void {
        this.on('command', callback);
    }

    public onStatusChange(callback: (status: string) => void): void {
        this.on('statusChange', callback);
    }

    public isRecording(): boolean {
        return this.isRecording;
    }

    public dispose(): void {
        this.stop();
        this.removeAllListeners();
    }
}
