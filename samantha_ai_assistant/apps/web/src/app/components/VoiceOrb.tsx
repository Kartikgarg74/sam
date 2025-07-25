'use client';
import React, { useState, useRef } from 'react';

const STATUS = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  speaking: 'Speaking',
  error: 'Error',
};

type OrbStatus = 'Idle' | 'Listening' | 'Processing' | 'Speaking' | 'Error';

type SpeechRecognitionResult = {
  transcript: string;
};
type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: SpeechRecognitionResult } };
};

type RecognitionType = {
  lang?: string;
  interimResults?: boolean;
  maxAlternatives?: number;
  onresult?: ((event: SpeechRecognitionEvent) => void) | null;
  onerror?: (() => void) | null;
  onend?: (() => void) | null;
  start: () => void;
};

export default function VoiceOrb() {
  const [status, setStatus] = useState<OrbStatus>('Idle');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<RecognitionType | null>(null);

  // Start browser voice recognition (Web Speech API)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setStatus('Error');
      return;
    }
    setStatus('Listening');
    setIsListening(true);
    const RecognitionClass = (window as typeof window & { webkitSpeechRecognition: { new (): RecognitionType } }).webkitSpeechRecognition;
    const recognition = new RecognitionClass() as RecognitionType;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setStatus('Processing');
      setIsListening(false);
      // TODO: Send to backend for intent/automation, then TTS
      // Placeholder: simulate TTS with ElevenLabs
      setTimeout(() => setStatus('Speaking'), 1000);
      setTimeout(() => setStatus('Idle'), 3000);
    };
    recognition.onerror = () => {
      setStatus('Error');
      setIsListening(false);
    };
    recognition.onend = () => {
      if (isListening) setStatus('Idle');
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Orb color based on status
  const orbColor = {
    Idle: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    Listening: 'bg-gradient-to-br from-green-400 to-blue-500 animate-pulse',
    Processing: 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse',
    Speaking: 'bg-gradient-to-br from-blue-400 to-purple-600 animate-pulse',
    Error: 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse',
  }[status];

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-center">
      <div
        className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${orbColor}`}
        style={{ boxShadow: status !== 'Idle' ? '0 0 32px 8px rgba(99,102,241,0.5)' : undefined }}
      >
        <button
          className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center shadow-md hover:scale-110 transition"
          onClick={startListening}
          aria-label="Activate voice input"
          disabled={isListening}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v2m0 0c-3.314 0-6-2.686-6-6m6 6c3.314 0 6-2.686 6-6m-6 6v-2m0-6a2 2 0 100-4 2 2 0 000 4zm0 0v4" />
          </svg>
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-700 font-semibold bg-white bg-opacity-80 px-2 py-1 rounded shadow">
        {status}
      </div>
      {transcript && (
        <div className="mt-1 text-xs text-gray-500 max-w-xs truncate">{transcript}</div>
      )}
    </div>
  );
}
