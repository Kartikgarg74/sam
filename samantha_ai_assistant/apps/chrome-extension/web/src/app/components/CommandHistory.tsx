'use client';

import { useState } from 'react';

interface Command {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  status: 'success' | 'error' | 'processing';
}

interface CommandHistoryProps {
  commands: Command[];
}

export function CommandHistory({ commands }: CommandHistoryProps) {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'processing':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (commands.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎙️</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No commands yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start speaking to see your command history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Commands ({commands.length})
        </h3>
        <button
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={() => {
            // Clear all commands
            chrome.runtime.sendMessage({ action: 'clearAllCommands' });
          }}
        >
          Clear All
        </button>
      </div>

      {/* Commands List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {commands.map((command) => (
          <div
            key={command.id}
            className={`
              border rounded-lg p-4 transition-all duration-200 cursor-pointer
              ${selectedCommand === command.id
                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => setSelectedCommand(
              selectedCommand === command.id ? null : command.id
            )}
          >
            {/* Command Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(command.status)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(command.status)}`}>
                  {command.status}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(command.timestamp)}
              </span>
            </div>

            {/* Command Text */}
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                "{command.command}"
              </p>
            </div>

            {/* Response (Expandable) */}
            {selectedCommand === command.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Response:</span> {command.response}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            {selectedCommand === command.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Repeat command
                    chrome.runtime.sendMessage({
                      action: 'repeatCommand',
                      command: command.command
                    });
                  }}
                >
                  Repeat
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Copy to clipboard
                    navigator.clipboard.writeText(command.command);
                  }}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {commands.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No commands in history</p>
        </div>
      )}
    </div>
  );
}
