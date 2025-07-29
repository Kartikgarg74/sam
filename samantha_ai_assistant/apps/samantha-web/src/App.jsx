import { useState, useRef } from 'react';
import CircleLogo from './CircleLogo.jsx';

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleTextInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSend = () => {
    // Placeholder for sending text input to backend
    setOutput(`You said: ${input}`);
    setInput('');
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioChunksRef.current = [];
          // Send audioBlob to backend for transcription
          console.log('Audio recorded:', audioBlob);
          await sendAudioToBackend(audioBlob);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        alert('Recording started...');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Error accessing microphone. Please ensure it is connected and permissions are granted.');
      }
    } else {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.wav');
    formData.append('auto_execute', 'true');

    try {
      const response = await fetch('http://localhost:8000/api/v1/voice-automation/process-and-execute', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend response:', result);
        setInput(result.command.original_text); // Update the input field with the transcribed text
        setOutput(`Transcribed: ${result.command.original_text}`);
      } else {
        console.error('Error sending audio to backend:', response.statusText);
        setOutput(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Network error sending audio:', error);
      setOutput(`Network Error: ${error.message}`);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Samantha AI</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* App Logo Placeholder */}
        <div className="flex justify-center mb-6">
          <CircleLogo />
        </div>

        {/* LLM Output Display */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4 h-48 overflow-y-auto">
          <p className="whitespace-pre-wrap">{output || 'Waiting for input...'}</p>
        </div>

        {/* Command Preview (Placeholder) */}
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-3 rounded-md mb-4">
          <p>Command Preview: <span className="font-semibold">No command to preview</span></p>
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Type your command..."
            value={input}
            onChange={handleTextInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            onClick={handleVoiceInput}
            className={`p-3 rounded-md focus:outline-none focus:ring-2 ${isRecording ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'}`}
          >
            {isRecording ? '🔴 Stop' : '🎤 Record'}
          </button>
          <button
            onClick={handleSend}
            className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>

        {/* UX Feedback (Placeholder) */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Status: Ready</p>
        </div>
      </div>
    </div>
  );
}

export default App;