import React, { useState, useRef } from 'react';
// --- Icons for progress tracking ---
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Mic, Volume2, X, Star } from 'lucide-react';
// --- Import the custom progress tracking hook ---
import useProgressTracker from '../hooks/useProgressTracker';

// Data for the colors lesson (unchanged)
const colors = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#8a4e32' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
];

const ColorsLesson = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const chunksRef = useRef([]);

  // --- Get user_id from localStorage ---
  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.user_id || user.id;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    const userId = localStorage.getItem('user_id');
    if (userId) return userId;
    console.warn('No user_id found. Speech data will not be saved to user profile.');
    return null;
  };

  // --- Initialize the progress hook for the 'colors' category ---
  const {
    completedItems: completedColors,
    isSubmitting,
    isLoading: isLoadingProgress,
    progressError,
    markItemAsComplete
  } = useProgressTracker('colors');

  // --- Browser Speech Synthesis ---
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      console.error("Browser does not support Speech Synthesis.");
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.pitch = 1.3;
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  // --- Click a color tile ---
  const handleColorClick = (color) => {
    setSelectedColor(color);
    setFeedback(null);
    setLastResult(null);
    speakText(color.name);
  };

  // --- Mark complete ---
  const handleMarkComplete = (colorName) => {
    markItemAsComplete(colorName, () => {
      speakText(`Great! You learned ${colorName}!`);
    });
  };

  // --------------------------------------------------------------------
  // ⭐⭐⭐ DEEPGRAM-OPTIMIZED AUDIO RECORDING (MAIN FIX) ⭐⭐⭐
  // --------------------------------------------------------------------
  const startRecording = async () => {
    if (!selectedColor) {
      alert("Please click a color first!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,          // ⭐ Deepgram Recommended
          channelCount: 1,
          echoCancellation: true,     // ⭐ Helps kids voices
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000   // ⭐ High-Quality Voice
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size < 2000) {
          alert("No audio detected! Please speak louder or closer to the mic.");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        sendAudioToBackend(blob, selectedColor.name);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100); // chunk every 100ms
      setIsRecording(true);
      setFeedback(null);
      mediaRecorderRef.current = mediaRecorder;

      // auto-stop after 4 seconds
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopRecording();
        }
      }, 4000);

    } catch (err) {
      console.error("🎤 Mic error:", err);
      alert("Please allow microphone access!");
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Send to backend ---
  const sendAudioToBackend = async (blob, expectedText) => {
    setIsAnalyzing(true);
    setFeedback("Analyzing your pronunciation...");

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("expected_text", expectedText);
    formData.append("lesson_type", "colors");

    const userId = getUserId();
    if (userId) formData.append("user_id", userId);

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze_speech", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Server Error:", await response.text());
        throw new Error("Server error");
      }

      const result = await response.json();
      setLastResult(result);
      setFeedback(result.reward);
      setShowModal(true);

      // auto-complete if accuracy high
      if (result.accuracy >= 75 && selectedColor && !completedColors.has(selectedColor.name)) {
        markItemAsComplete(selectedColor.name);
      }

      // reward audio
      if (result.reward_audio) {
        const audio = new Audio(`data:audio/mp3;base64,${result.reward_audio}`);
        audio.play();
      } else {
        speakText(result.reward);
      }

    } catch (err) {
      console.error("❌ Error:", err);
      setFeedback("⚠ Cannot connect to server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Stars UI ---
  const renderStars = (stars) => (
    <div className="flex gap-2">
      {[1,2,3].map(i => (
        <Star key={i} className={`w-8 h-8 ${i <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );

  // --------------------------------------------------------------------
  // ------------------------------- UI ---------------------------------
  // --------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-8 bg-purple-50 font-sans">

      <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800 mb-6 mt-10 text-center">
        🌈 Color World! 🌈
      </h1>

      <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl px-2">
        Click a color to hear it — then press the mic and say it!
      </p>

      {/* Show login warning */}
      {!getUserId() && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl mb-6 text-center">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          <strong>Note:</strong> Login to save your progress.
        </div>
      )}

      {/* Color grid */}
      {!isLoadingProgress && (
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-white rounded-3xl shadow-2xl mb-6">

          {colors.map((color) => {
            const isCompleted = completedColors.has(color.name);
            const isSelected = selectedColor?.name === color.name;

            const brightness =
              parseInt(color.hex.substring(1, 3), 16) * 0.299 +
              parseInt(color.hex.substring(3, 5), 16) * 0.587 +
              parseInt(color.hex.substring(5, 7), 16) * 0.114;
            const textColor = brightness > 150 ? "#333" : "#fff";

            return (
              <div
                key={color.name}
                className={`flex flex-col items-center justify-between p-4 rounded-xl shadow-md transition-all duration-300
                  h-40 sm:h-48 group relative overflow-hidden
                  ${isCompleted ? "ring-4 ring-green-500 ring-offset-2" : ""}
                  ${isSelected ? "ring-4 ring-purple-500 ring-offset-2" : ""}
                `}
                style={{ backgroundColor: color.hex, color: textColor }}
              >
                <div
                  className="flex-grow flex items-center justify-center cursor-pointer"
                  onClick={() => handleColorClick(color)}
                >
                  <p className="text-xl sm:text-2xl font-bold">{color.name}</p>
                </div>

                {/* Mark as learned */}
                <button
                  onClick={() => handleMarkComplete(color.name)}
                  disabled={isCompleted || isSubmitting}
                  className={`mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm
                    ${isCompleted ? "bg-green-600 text-white"
                      : isSubmitting ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                      : "bg-white/90 text-gray-800 opacity-0 group-hover:opacity-100"}
                  `}
                >
                  {isCompleted ? "Done ✓" : "Learned!"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected color preview */}
      {selectedColor && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Selected Color:</h3>
            <button onClick={() => speakText(selectedColor.name)}
              className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors">
              <Volume2 className="w-5 h-5 text-purple-600" />
            </button>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg border-4 border-gray-300"
              style={{ backgroundColor: selectedColor.hex }}>
            </div>
            <div className="text-3xl font-semibold text-gray-700">{selectedColor.name}</div>
          </div>
        </div>
      )}

      {/* Recording Button */}
      <div className="flex flex-col items-center space-y-4 mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing || !selectedColor}
          className={`flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-white text-lg
            ${isRecording ? "bg-red-500 animate-pulse scale-110"
              : isAnalyzing ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105"}
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : isRecording ? (
            <>
              <Mic className="w-6 h-6 animate-pulse" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span>🎤 Press & Speak</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback */}
      {feedback && !showModal && (
        <div className="text-center max-w-md w-full">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl px-6 py-4 shadow-lg">
            <p>{feedback}</p>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showModal && lastResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <div className="text-center">
              {/* color */}
              <div className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg border-4 border-gray-300"
                style={{ backgroundColor: selectedColor?.hex }} />

              {/* reward */}
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {lastResult.reward}
              </h2>

              {renderStars(lastResult.stars)}

              {/* details */}
              <div className="bg-gray-100 rounded-xl p-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>You said:</span>
                  <span className="font-bold">{lastResult.recognized_text}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-bold text-purple-600">{lastResult.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span className="font-bold text-purple-600">+{lastResult.points_added}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  speakText(selectedColor.name);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 rounded-xl mt-6"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="fixed bottom-8 right-8 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
          <Volume2 className="w-5 h-5 inline mr-2" /> Speaking...
        </div>
      )}

    </div>
  );
};

export default ColorsLesson;
