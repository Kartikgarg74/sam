'use client';

import { useState, useEffect } from 'react';

interface VoiceOrbProps {
  isListening: boolean;
  onToggle: () => void;
}

export function VoiceOrb({ isListening, onToggle }: VoiceOrbProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isListening) {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [isListening]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Voice Orb */}
      <div
        className={`
          relative w-32 h-32 rounded-full cursor-pointer transition-all duration-300 ease-in-out
          ${isListening
            ? 'bg-gradient-to-r from-red-400 to-pink-500 shadow-lg shadow-red-500/50'
            : 'bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600'
          }
          ${pulseAnimation ? 'animate-pulse' : ''}
          ${isHovered ? 'scale-105' : 'scale-100'}
        `}
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Inner Circle */}
        <div className="absolute inset-4 bg-white/20 rounded-full flex items-center justify-center">
          <div className="text-white text-4xl">
            {isListening ? '🎤' : '🎙️'}
          </div>
        </div>

        {/* Pulse Rings */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping animation-delay-300"></div>
          </>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={`text-lg font-semibold ${isListening ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
          {isListening ? 'Listening...' : 'Click to Start'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isListening ? 'Speak your command' : 'Voice control ready'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <button
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${isListening
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
            }
          `}
          onClick={onToggle}
        >
          {isListening ? 'Stop' : 'Start'}
        </button>

        <button
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-all duration-200"
          onClick={() => {
            // Clear command history
            chrome.runtime.sendMessage({ action: 'clearHistory' });
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
