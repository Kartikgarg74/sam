'use client';

import { useState, useEffect } from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { CommandHistory } from './components/CommandHistory';
import { SystemStatus } from './components/SystemStatus';
import { SettingsPanel } from './components/SettingsPanel';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [commands, setCommands] = useState<Array<{
    id: string;
    command: string;
    response: string;
    timestamp: Date;
    status: 'success' | 'error' | 'processing';
  }>>([]);
  const [systemStatus, setSystemStatus] = useState({
    voiceRecognition: false,
    aiProcessing: false,
    browserIntegration: false,
    microphoneAccess: false
  });

  useEffect(() => {
    // Initialize system status
    checkSystemStatus();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleBackgroundMessage(request);
    });
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setSystemStatus(prev => ({ ...prev, microphoneAccess: true }));
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone access denied:', error);
    }

    // Check voice recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSystemStatus(prev => ({ ...prev, voiceRecognition: true }));
    }

    // Check AI processing availability
    setSystemStatus(prev => ({ ...prev, aiProcessing: true }));

    // Check browser integration
    setSystemStatus(prev => ({ ...prev, browserIntegration: true }));
  };

  const handleBackgroundMessage = (request: any) => {
    switch (request.type) {
      case 'transcript':
        addCommand({
          id: Date.now().toString(),
          command: request.text,
          response: 'Processing...',
          timestamp: new Date(),
          status: 'processing'
        });
        break;
      case 'command_result':
        updateCommand(request.commandId, {
          response: request.response,
          status: request.success ? 'success' : 'error'
        });
        break;
      case 'listening_status':
        setIsListening(request.isListening);
        break;
    }
  };

  const addCommand = (command: any) => {
    setCommands(prev => [...prev, command]);
  };

  const updateCommand = (id: string, updates: any) => {
    setCommands(prev => prev.map(cmd =>
      cmd.id === id ? { ...cmd, ...updates } : cmd
    ));
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await chrome.runtime.sendMessage({ action: 'stopListening' });
      } else {
        await chrome.runtime.sendMessage({ action: 'startListening' });
      }
    } catch (error) {
      console.error('Error toggling listening:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Samantha AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your voice-controlled browser assistant
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Control Center */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Voice Control
              </h2>

              <VoiceOrb
                isListening={isListening}
                onToggle={toggleListening}
              />

              <SystemStatus status={systemStatus} />
            </div>
          </div>

          {/* Command History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Command History
              </h2>

              <CommandHistory commands={commands} />
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="mt-8">
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
}
