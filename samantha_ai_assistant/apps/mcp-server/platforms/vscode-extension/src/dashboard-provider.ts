import * as vscode from 'vscode';
import { MCPClient, MCPCommandResult } from './mcp-client';

interface CommandHistoryItem {
    command: string;
    result: MCPCommandResult;
    timestamp: Date;
}

export class DashboardProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'samantha-ai.dashboard';

    private _view?: vscode.WebviewView;
    private commandHistory: CommandHistoryItem[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly mcpClient: MCPClient
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'startVoiceControl':
                        vscode.commands.executeCommand('samantha-ai.startVoiceControl');
                        break;
                    case 'stopVoiceControl':
                        vscode.commands.executeCommand('samantha-ai.stopVoiceControl');
                        break;
                    case 'executeCommand':
                        vscode.commands.executeCommand('samantha-ai.executeCommand');
                        break;
                    case 'clearHistory':
                        this.clearHistory();
                        break;
                }
            }
        );
    }

    public show(): void {
        if (this._view) {
            this._view.show(true);
        }
    }

    public updateCommandHistory(command: string, result: MCPCommandResult): void {
        const historyItem: CommandHistoryItem = {
            command,
            result,
            timestamp: new Date()
        };

        this.commandHistory.unshift(historyItem);

        // Keep only last 50 commands
        if (this.commandHistory.length > 50) {
            this.commandHistory = this.commandHistory.slice(0, 50);
        }

        this.updateWebview();
    }

    public clearHistory(): void {
        this.commandHistory = [];
        this.updateWebview();
    }

    private updateWebview(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateHistory',
                history: this.commandHistory
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samantha AI Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
        }
        .container {
            max-width: 100%;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
        }
        .controls {
            display: flex;
            gap: 8px;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn.primary {
            background-color: var(--vscode-button-prominentBackground);
            color: var(--vscode-button-prominentForeground);
        }
        .btn.danger {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-button-foreground);
        }
        .status {
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 12px;
        }
        .status.connected {
            background-color: var(--vscode-notificationsInfoBackground);
            color: var(--vscode-notificationsInfoForeground);
        }
        .status.error {
            background-color: var(--vscode-notificationsErrorBackground);
            color: var(--vscode-notificationsErrorForeground);
        }
        .history {
            max-height: 300px;
            overflow-y: auto;
        }
        .history-item {
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 12px;
        }
        .history-item:last-child {
            border-bottom: none;
        }
        .command {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .result {
            font-size: 11px;
            opacity: 0.8;
        }
        .success {
            color: var(--vscode-notificationsInfoForeground);
        }
        .error {
            color: var(--vscode-notificationsErrorForeground);
        }
        .timestamp {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
        }
        .empty-state {
            text-align: center;
            padding: 32px 16px;
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Samantha AI</h1>
            <div class="controls">
                <button class="btn primary" id="startBtn">Start Voice</button>
                <button class="btn danger" id="stopBtn">Stop Voice</button>
                <button class="btn" id="executeBtn">Execute</button>
                <button class="btn" id="clearBtn">Clear</button>
            </div>
        </div>

        <div class="status" id="status">
            Status: Disconnected
        </div>

        <div class="history" id="history">
            <div class="empty-state">
                No commands yet. Start voice control to begin!
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Elements
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const executeBtn = document.getElementById('executeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const statusEl = document.getElementById('status');
        const historyEl = document.getElementById('history');

        // Event listeners
        startBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'startVoiceControl' });
        });

        stopBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'stopVoiceControl' });
        });

        executeBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'executeCommand' });
        });

        clearBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'clearHistory' });
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateHistory':
                    updateHistory(message.history);
                    break;
                case 'updateStatus':
                    updateStatus(message.status);
                    break;
            }
        });

        function updateHistory(history) {
            if (history.length === 0) {
                historyEl.innerHTML = '<div class="empty-state">No commands yet. Start voice control to begin!</div>';
                return;
            }

            historyEl.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="command">${escapeHtml(item.command)}</div>
                    <div class="result ${item.result.success ? 'success' : 'error'}">
                        ${item.result.success ? '✓ Success' : '✗ Error'}: ${escapeHtml(item.result.message || item.result.error || '')}
                    </div>
                    <div class="timestamp">${new Date(item.timestamp).toLocaleTimeString()}</div>
                </div>
            `).join('');
        }

        function updateStatus(status) {
            statusEl.textContent = \`Status: \${status}\`;
            statusEl.className = \`status \${status === 'connected' ? 'connected' : 'error'}\`;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}
