import * as vscode from 'vscode';
import { SamanthaAICursorExtension } from './samantha-ai-cursor-extension';
import { MCPClient } from './mcp-client';
import { VoiceController } from './voice-controller';
import { CodeGenerator } from './code-generator';
import { DashboardProvider } from './dashboard-provider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Samantha AI Cursor Extension is now active!');

    // Initialize MCP client
    const mcpClient = new MCPClient();

    // Initialize voice controller
    const voiceController = new VoiceController(mcpClient);

    // Initialize code generator
    const codeGenerator = new CodeGenerator();

    // Initialize dashboard provider
    const dashboardProvider = new DashboardProvider(context.extensionUri, mcpClient);

    // Initialize main extension
    const samanthaAI = new SamanthaAICursorExtension(
        context,
        mcpClient,
        voiceController,
        codeGenerator,
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

    const generateCode = vscode.commands.registerCommand(
        'samantha-ai.generateCode',
        () => samanthaAI.generateCode()
    );

    const explainCode = vscode.commands.registerCommand(
        'samantha-ai.explainCode',
        () => samanthaAI.explainCode()
    );

    const refactorCode = vscode.commands.registerCommand(
        'samantha-ai.refactorCode',
        () => samanthaAI.refactorCode()
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
        generateCode,
        explainCode,
        refactorCode,
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
    console.log('Samantha AI Cursor Extension is now deactivated!');
}
