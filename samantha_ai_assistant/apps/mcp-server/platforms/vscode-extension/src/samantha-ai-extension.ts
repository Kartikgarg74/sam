import * as vscode from 'vscode';
import { MCPClient } from './mcp-client';
import { VoiceController } from './voice-controller';
import { DashboardProvider } from './dashboard-provider';

export class SamanthaAIVSCodeExtension {
    private context: vscode.ExtensionContext;
    private mcpClient: MCPClient;
    private voiceController: VoiceController;
    private dashboardProvider: DashboardProvider;
    private isListening = false;
    private statusBarItem: vscode.StatusBarItem;

    constructor(
        context: vscode.ExtensionContext,
        mcpClient: MCPClient,
        voiceController: VoiceController,
        dashboardProvider: DashboardProvider
    ) {
        this.context = context;
        this.mcpClient = mcpClient;
        this.voiceController = voiceController;
        this.dashboardProvider = dashboardProvider;

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.text = "$(mic) Samantha AI";
        this.statusBarItem.tooltip = "Click to start voice control";
        this.statusBarItem.command = 'samantha-ai.startVoiceControl';
        this.statusBarItem.show();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for voice commands
        this.voiceController.onCommand((command: string) => {
            this.handleVoiceCommand(command);
        });

        // Listen for MCP server status changes
        this.mcpClient.onStatusChange((status: string) => {
            this.updateStatusBar(status);
        });
    }

    public async startVoiceControl(): Promise<void> {
        try {
            // Check if MCP server is available
            const isConnected = await this.mcpClient.connect();
            if (!isConnected) {
                vscode.window.showErrorMessage(
                    'Cannot connect to Samantha AI MCP Server. Please ensure the server is running.'
                );
                return;
            }

            // Start voice controller
            await this.voiceController.start();
            this.isListening = true;

            // Update UI
            this.updateStatusBar('listening');
            vscode.window.showInformationMessage('Voice control started. Speak your command!');

            // Update status bar
            this.statusBarItem.text = "$(mic) Listening...";
            this.statusBarItem.tooltip = "Click to stop voice control";
            this.statusBarItem.command = 'samantha-ai.stopVoiceControl';

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start voice control: ${error}`);
        }
    }

    public async stopVoiceControl(): Promise<void> {
        try {
            await this.voiceController.stop();
            this.isListening = false;

            // Update UI
            this.updateStatusBar('stopped');
            vscode.window.showInformationMessage('Voice control stopped.');

            // Update status bar
            this.statusBarItem.text = "$(mic) Samantha AI";
            this.statusBarItem.tooltip = "Click to start voice control";
            this.statusBarItem.command = 'samantha-ai.startVoiceControl';

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop voice control: ${error}`);
        }
    }

    public async executeCommand(): Promise<void> {
        try {
            // Show input box for manual command
            const command = await vscode.window.showInputBox({
                prompt: 'Enter Samantha AI command',
                placeHolder: 'e.g., "open file", "create folder", "run test"'
            });

            if (command) {
                await this.handleVoiceCommand(command);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
        }
    }

    public openDashboard(): void {
        this.dashboardProvider.show();
    }

    private async handleVoiceCommand(command: string): Promise<void> {
        try {
            // Show progress
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Processing command...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Process command through MCP server
                const result = await this.mcpClient.executeCommand(command);

                progress.report({ increment: 100 });

                // Handle result
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Command executed successfully: ${result.message}`
                    );

                    // Update dashboard
                    this.dashboardProvider.updateCommandHistory(command, result);
                } else {
                    vscode.window.showErrorMessage(
                        `Command failed: ${result.error}`
                    );
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process command: ${error}`);
        }
    }

    private updateStatusBar(status: string): void {
        switch (status) {
            case 'connected':
                this.statusBarItem.text = "$(check) Samantha AI";
                this.statusBarItem.tooltip = "Connected to MCP Server";
                break;
            case 'listening':
                this.statusBarItem.text = "$(mic) Listening...";
                this.statusBarItem.tooltip = "Voice control active";
                break;
            case 'processing':
                this.statusBarItem.text = "$(sync~spin) Processing...";
                this.statusBarItem.tooltip = "Processing command";
                break;
            case 'error':
                this.statusBarItem.text = "$(error) Samantha AI";
                this.statusBarItem.tooltip = "Connection error";
                break;
            default:
                this.statusBarItem.text = "$(mic) Samantha AI";
                this.statusBarItem.tooltip = "Click to start voice control";
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
        this.voiceController.dispose();
        this.mcpClient.disconnect();
    }
}
