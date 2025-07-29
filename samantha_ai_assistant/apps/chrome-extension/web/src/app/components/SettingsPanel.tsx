'use client';

import { useState, useEffect } from 'react';

interface Settings {
  autoStart: boolean;
  voiceFeedback: boolean;
  soundEffects: boolean;
  language: string;
  sensitivity: number;
  maxHistory: number;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    autoStart: false,
    voiceFeedback: true,
    soundEffects: true,
    language: 'en-US',
    sensitivity: 0.7,
    maxHistory: 50
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load settings from Chrome storage
    chrome.storage.sync.get(Object.keys(settings), (result) => {
      setSettings(prev => ({ ...prev, ...result }));
    });
  }, []);

  const updateSetting = async (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save to Chrome storage
    await chrome.storage.sync.set({ [key]: value });

    // Notify background script of setting change
    chrome.runtime.sendMessage({
      action: 'updateSetting',
      setting: key,
      value: value
    });
  };

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Settings
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Voice Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Voice Settings
            </h3>
            <div className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Select language for voice recognition"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sensitivity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice Sensitivity: {Math.round(settings.sensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => updateSetting('sensitivity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="Voice sensitivity level"
                />
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Behavior
            </h3>
            <div className="space-y-4">
              {/* Auto Start */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Auto-start on extension open
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically start listening when you open the extension
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoStart ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  onClick={() => updateSetting('autoStart', !settings.autoStart)}
                  aria-label={`${settings.autoStart ? 'Disable' : 'Enable'} auto-start on extension open`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoStart ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Voice Feedback */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Voice feedback
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Speak responses back to you
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.voiceFeedback ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  onClick={() => updateSetting('voiceFeedback', !settings.voiceFeedback)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.voiceFeedback ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Sound effects
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Play audio cues for actions
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEffects ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  onClick={() => updateSetting('soundEffects', !settings.soundEffects)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Data & Privacy
            </h3>
            <div className="space-y-4">
              {/* Max History */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max command history: {settings.maxHistory}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={settings.maxHistory}
                  onChange={(e) => updateSetting('maxHistory', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Clear Data Button */}
              <div className="flex space-x-3">
                <button
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => {
                    chrome.runtime.sendMessage({ action: 'clearAllData' });
                  }}
                >
                  Clear All Data
                </button>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => {
                    chrome.runtime.sendMessage({ action: 'exportData' });
                  }}
                >
                  Export Settings
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Samantha AI Assistant v1.0.0
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Voice-controlled browser automation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
