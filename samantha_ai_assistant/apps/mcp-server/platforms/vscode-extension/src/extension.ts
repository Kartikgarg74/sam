import * as vscode from 'vscode';
import { SamanthaAIVSCodeExtension } from './samantha-ai-extension';
import { MCPClient } from './mcp-client';
import { VoiceController } from './voice-controller';
import { DashboardProvider } from './dashboard-provider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Samantha AI VS Code Extension is now active!');

    // Initialize MCP client
    const mcpClient = new MCPClient();

    // Initialize voice controller
    const voiceController = new VoiceController(mcpClient);

    // Initialize dashboard provider
    const dashboardProvider = new DashboardProvider(context.extensionUri, mcpClient);

    // Initialize main extension
    const samanthaAI = new SamanthaAIVSCodeExtension(
        context,
        mcpClient,
        voiceController,
        dashboardProvider
    );

    // Register commands
    const startVoiceControl = vscode.commands.registerCommand(
        'samantha-ai.startVoiceControl',
        () => samanthaAI.startVoiceControl()
    );

    const stopVoiceControl = vscode.commands.registerCommand(
        'samantha-ai.stopVoiceControl',
        () => samanthaAI.stopVoiceControl()
    );

    const executeCommand = vscode.commands.registerCommand(
        'samantha-ai.executeCommand',
        () => samanthaAI.executeCommand()
    );

    const openDashboard = vscode.commands.registerCommand(
        'samantha-ai.openDashboard',
        () => samanthaAI.openDashboard()
    );

    // Register webview provider
    const dashboardWebviewProvider = vscode.window.registerWebviewViewProvider(
        'samantha-ai.dashboard',
        dashboardProvider
    );

    // Add to subscriptions
    context.subscriptions.push(
        startVoiceControl,
        stopVoiceControl,
        executeCommand,
        openDashboard,
        dashboardWebviewProvider
    );

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('samantha-ai');
    if (config.get('autoStart')) {
        samanthaAI.startVoiceControl();
    }

    // Show welcome message
    vscode.window.showInformationMessage(
        'Samantha AI Assistant is ready! Use Ctrl+Shift+V to start voice control.'
    );
}

export function deactivate() {
    console.log('Samantha AI VS Code Extension is now deactivated!');
}
