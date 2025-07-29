'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { analytics } from '../utils/analytics';

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
  onerror?: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend?: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface VoiceOrbEnhancedProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  showTranscript?: boolean;
  onStatusChange?: (status: OrbStatus) => void;
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceOrbEnhanced({
  className = '',
  position = 'top-right',
  size = 'medium',
  showStatus = true,
  showTranscript = true,
  onStatusChange,
  onTranscript,
  disabled = false
}: VoiceOrbEnhancedProps) {
  const [status, setStatus] = useState<OrbStatus>('Idle');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<RecognitionType | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update status and notify parent
  const updateStatus = useCallback((newStatus: OrbStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Clear error message
  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  // Check browser support
  const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // Get recognition class
  const getRecognitionClass = () => {
    if ('webkitSpeechRecognition' in window) {
      return (window as typeof window & { webkitSpeechRecognition: { new (): RecognitionType } }).webkitSpeechRecognition;
    }
    if ('SpeechRecognition' in window) {
      return (window as typeof window & { SpeechRecognition: { new (): RecognitionType } }).SpeechRecognition;
    }
    return null;
  };

  // Handle speech recognition errors
  const handleSpeechRecognitionError = useCallback((error: SpeechRecognitionErrorEvent) => {
    let errorType = ErrorType.SPEECH_RECOGNITION_ERROR;
    let errorMessage = 'Voice recognition failed';

    switch (error.error) {
      case 'no-speech':
        errorType = ErrorType.SPEECH_RECOGNITION_NO_SPEECH;
        errorMessage = 'No speech detected';
        break;
      case 'audio-capture':
        errorType = ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE;
        errorMessage = 'Microphone access denied';
        break;
      case 'network':
        errorType = ErrorType.SPEECH_RECOGNITION_NETWORK;
        errorMessage = 'Network error during voice recognition';
        break;
      case 'aborted':
        errorType = ErrorType.SPEECH_RECOGNITION_ABORTED;
        errorMessage = 'Voice recognition was cancelled';
        break;
      case 'not-allowed':
        errorType = ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE;
        errorMessage = 'Microphone permission denied';
        break;
      default:
        errorType = ErrorType.SPEECH_RECOGNITION_ERROR;
        errorMessage = error.message || 'Voice recognition error';
    }

    errorHandler.handleError(new Error(errorMessage), {
      type: errorType,
      context: { originalError: error.error, originalMessage: error.message }
    });

    setErrorMessage(errorMessage);
    updateStatus('Error');
    setIsListening(false);
  }, [updateStatus]);

  // Start browser voice recognition
  const startListening = useCallback(() => {
    analytics.trackFeatureUsage('voice_orb_start_listening');
    if (disabled) {
      errorHandler.handleError('Voice orb is disabled', {
        type: ErrorType.VALIDATION_ERROR
      });
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      errorHandler.handleError('Speech recognition not supported', {
        type: ErrorType.SPEECH_RECOGNITION_NOT_SUPPORTED
      });
      updateStatus('Error');
      setErrorMessage('Voice recognition not supported in this browser');
      return;
    }

    try {
      updateStatus('Listening');
      setIsListening(true);
      clearError();

      const RecognitionClass = getRecognitionClass();
      if (!RecognitionClass) {
        throw new Error('Failed to get speech recognition class');
      }

      const recognition = new RecognitionClass() as RecognitionType;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          onTranscript?.(text);
          analytics.trackFeatureUsage('voice_orb_transcript', { transcript: text });
          updateStatus('Processing');
          setIsListening(false);

          // Simulate processing and speaking
          setTimeout(() => updateStatus('Speaking'), 1000);
          setTimeout(() => updateStatus('Idle'), 3000);
        } catch (error) {
          analytics.trackError('voice_orb_result_error', { error });
          errorHandler.handleError(error instanceof Error ? error : new Error('Failed to process speech result'), {
            type: ErrorType.SPEECH_RECOGNITION_ERROR,
            context: { event }
          });
          updateStatus('Error');
          setIsListening(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        analytics.trackError('voice_orb_recognition_error', { error: event.error, message: event.message });
        handleSpeechRecognitionError(event);
      };

      recognition.onend = () => {
        analytics.trackPerformance('voice_orb_recognition_duration', Date.now() - (retryTimeoutRef.current as any)?.startTime || 0);
        if (isListening) {
          updateStatus('Idle');
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Set timeout for speech recognition
      retryTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          errorHandler.handleError('Speech recognition timeout', {
            type: ErrorType.SPEECH_RECOGNITION_TIMEOUT
          });
          stopListening();
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Failed to start speech recognition'), {
        type: ErrorType.SPEECH_RECOGNITION_ERROR
      });
      updateStatus('Error');
      setIsListening(false);
    }
  }, [disabled, updateStatus, onTranscript, isListening, clearError, handleSpeechRecognitionError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (error) {
        errorHandler.handleError(error instanceof Error ? error : new Error('Failed to stop speech recognition'), {
          type: ErrorType.SPEECH_RECOGNITION_ERROR
        });
      }
    }
    setIsListening(false);
    updateStatus('Idle');
  }, [updateStatus]);

  // Handle retry events
  useEffect(() => {
    const handleRetry = (event: CustomEvent) => {
      const errorDetails = event.detail;
      if (errorDetails.type === ErrorType.SPEECH_RECOGNITION_ERROR ||
          errorDetails.type === ErrorType.SPEECH_RECOGNITION_TIMEOUT) {
        // Retry speech recognition
        setTimeout(() => {
          if (!disabled) {
            startListening();
          }
        }, 1000);
      }
    };

    window.addEventListener('samantha:retry', handleRetry as EventListener);
    return () => {
      window.removeEventListener('samantha:retry', handleRetry as EventListener);
    };
  }, [startListening, disabled]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
        break;
      case 'Escape':
        if (isListening) {
          stopListening();
        }
        break;
    }
  }, [disabled, isListening, startListening, stopListening]);

  // Handle touch events
  const handleTouchStart = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!disabled) {
      setIsPressed(false);
      if (!isListening) {
        startListening();
      }
    }
  }, [disabled, isListening, startListening]);

  // Handle mouse events
  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    if (!disabled) {
      setIsPressed(false);
      if (!isListening) {
        startListening();
      }
    }
  }, [disabled, isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Get position classes
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6'
    };
    return positions[position];
  };

  // Get size classes
  const getSizeClasses = () => {
    const sizes = {
      small: {
        orb: 'w-16 h-16',
        button: 'w-12 h-12',
        icon: 'w-6 h-6'
      },
      medium: {
        orb: 'w-20 h-20',
        button: 'w-14 h-14',
        icon: 'w-7 h-7'
      },
      large: {
        orb: 'w-24 h-24',
        button: 'w-18 h-18',
        icon: 'w-8 h-8'
      }
    };
    return sizes[size];
  };

  // Orb color based on status
  const orbColor = {
    Idle: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    Listening: 'bg-gradient-to-br from-green-400 to-blue-500 animate-pulse',
    Processing: 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse',
    Speaking: 'bg-gradient-to-br from-blue-400 to-purple-600 animate-pulse',
    Error: 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse',
  }[status];

  const sizeClasses = getSizeClasses();

  return (
    <div
      ref={orbRef}
      className={`voice-orb voice-orb-enhanced fixed z-50 flex flex-col items-center transition-all duration-300 ${getPositionClasses()} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`voice-orb-container ${sizeClasses.orb} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${orbColor} ${
          isHovered ? 'scale-105' : ''
        } ${isPressed ? 'scale-95' : ''}`}
        style={{
          boxShadow: status !== 'Idle' ? '0 0 32px 8px rgba(99,102,241,0.5)' : undefined
        }}
      >
        <button
          ref={buttonRef}
          className={`voice-orb-button ${sizeClasses.button} rounded-full bg-white bg-opacity-80 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={startListening}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={disabled || isListening}
          aria-label={`${isListening ? 'Stop' : 'Start'} voice input`}
          aria-pressed={isListening}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          <svg
            width={sizeClasses.icon}
            height={sizeClasses.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="text-indigo-600"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18v2m0 0c-3.314 0-6-2.686-6-6m6 6c3.314 0 6-2.686 6-6m-6 6v-2m0-6a2 2 0 100-4 2 2 0 000 4zm0 0v4"
            />
          </svg>
        </button>
      </div>

      {showStatus && (
        <div className="voice-orb-status mt-2 text-xs text-gray-700 font-semibold bg-white bg-opacity-80 px-2 py-1 rounded shadow">
          {status}
        </div>
      )}

      {showTranscript && transcript && (
        <div className="voice-orb-transcript mt-1 text-xs text-gray-500 max-w-xs truncate bg-white bg-opacity-80 px-2 py-1 rounded">
          {transcript}
        </div>
      )}

      {errorMessage && (
        <div className="voice-orb-error mt-1 text-xs text-red-600 max-w-xs bg-red-50 bg-opacity-80 px-2 py-1 rounded border border-red-200">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
