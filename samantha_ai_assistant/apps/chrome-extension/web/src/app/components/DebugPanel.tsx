'use client';
import React, { useState, useEffect } from 'react';
import { errorHandler, ErrorDetails } from '../utils/errorHandler';
import { storageManager } from '../utils/storageManager';
import { apiClient } from '../utils/apiClient';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'errors' | 'system' | 'storage' | 'network' | 'test';

export default function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('errors');
  const [errorLog, setErrorLog] = useState<ErrorDetails[]>([]);
  const [systemInfo, setSystemInfo] = useState<Record<string, unknown>>({});
  const [storageInfo, setStorageInfo] = useState<Record<string, unknown>>({});
  const [networkStatus, setNetworkStatus] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isOpen) {
      loadDebugInfo();
    }
  }, [isOpen]);

  const loadDebugInfo = async () => {
    setErrorLog(errorHandler.getErrorLog());
    setSystemInfo(errorHandler.getDebugInfo());
    setStorageInfo(storageManager.getDebugInfo());
    setNetworkStatus({
      online: navigator.onLine,
      connectionType: (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } }).connection?.type || 'unknown',
      effectiveType: (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } }).connection?.effectiveType || 'unknown',
      downlink: (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } }).connection?.downlink || 'unknown',
      rtt: (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } }).connection?.rtt || 'unknown'
    });
  };

  const clearErrorLog = () => {
    errorHandler.clearErrorLog();
    setErrorLog([]);
  };

  const testError = (errorType: TabType) => {
    switch (errorType) {
      case 'network':
        errorHandler.handleError(new Error('Test network error'), {
          type: 'NETWORK_UNKNOWN' as import('../utils/errorHandler').ErrorType
        });
        break;
      case 'storage':
        errorHandler.handleError(new Error('Test storage error'), {
          type: 'STORAGE_ACCESS_DENIED' as import('../utils/errorHandler').ErrorType
        });
        break;
      case 'test':
        errorHandler.handleError(new Error('Test API error'), {
          type: 'API_SERVER_ERROR' as import('../utils/errorHandler').ErrorType
        });
        break;
      case 'errors':
        errorHandler.handleError(new Error('Test speech recognition error'), {
          type: 'SPEECH_RECOGNITION_ERROR' as import('../utils/errorHandler').ErrorType
        });
        break;
      default:
        break;
    }
    loadDebugInfo();
  };

  const testStorage = async () => {
    try {
      await storageManager.set('test-key', { test: true, timestamp: Date.now() });
      const result = await storageManager.get('test-key');
      await storageManager.remove('test-key');
      alert(`Storage test successful: ${JSON.stringify(result)}`);
    } catch (error) {
      alert(`Storage test failed: ${error}`);
    }
  };

  const testNetwork = async () => {
    try {
      const response = await apiClient.get('https://httpbin.org/get', { timeout: 5000 });
      alert(`Network test successful: ${response.status}`);
    } catch (error) {
      alert(`Network test failed: ${error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="debug-panel fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Debug Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close debug panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'errors', label: 'Error Log' },
            { id: 'system', label: 'System Info' },
            { id: 'storage', label: 'Storage' },
            { id: 'network', label: 'Network' },
            { id: 'test', label: 'Test' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'errors' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Error Log ({errorLog.length})</h3>
                <button
                  onClick={clearErrorLog}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Clear Log
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-auto">
                {errorLog.length === 0 ? (
                  <p className="text-gray-500">No errors logged</p>
                ) : (
                  errorLog.map((error, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-red-600">{error.type}</div>
                          <div className="text-sm text-gray-600">{error.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {error.context && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Context</summary>
                          <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(systemInfo).map(([key, value]) => (
                  <div key={key} className="border rounded p-3">
                    <div className="font-semibold text-gray-700">{key}</div>
                    <div className="text-sm text-gray-600">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Storage Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(storageInfo).map(([key, value]) => (
                  <div key={key} className="border rounded p-3">
                    <div className="font-semibold text-gray-700">{key}</div>
                    <div className="text-sm text-gray-600">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={testStorage}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Storage
                </button>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Network Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(networkStatus).map(([key, value]) => (
                  <div key={key} className="border rounded p-3">
                    <div className="font-semibold text-gray-700">{key}</div>
                    <div className="text-sm text-gray-600">{String(value)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={testNetwork}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Network
                </button>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Error Testing</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'network', label: 'Network Error' },
                  { type: 'storage', label: 'Storage Error' },
                  { type: 'test', label: 'API Error' },
                  { type: 'errors', label: 'Speech Error' }
                ].map(test => (
                  <button
                    key={test.type}
                    onClick={() => testError(test.type as TabType)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    {test.label}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Recovery Testing</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const debugInfo = errorHandler.getDebugInfo();
                      const currentDebugMode = (debugInfo.config as { enableDebugMode?: boolean })?.enableDebugMode || false;
                      errorHandler.setDebugMode(!currentDebugMode);
                      loadDebugInfo();
                    }}
                    className="block w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Toggle Debug Mode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
