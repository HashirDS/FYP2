import React, { useState, useRef } from "react";
import { CheckCircle2, AlertCircle, Loader2, Mic, Star, Volume2, X, Sparkles } from "lucide-react";
// --- Import the custom progress tracking hook ---
import useProgressTracker from '../hooks/useProgressTracker';

// Convert numbers to words
const numberToWord = (num) => {
  const words = [
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tensWords = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  if (num < 20) return words[num - 1];
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const units = num % 10;
    return units === 0 ? tensWords[tens] : `${tensWords[tens]} ${words[units - 1]}`;
  }
  if (num === 100) return "One Hundred";
  return num.toString();
};

const NumLesson = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

  // --- Initialize the progress hook for the 'numbers' category ---
  const {
    completedItems: completedNumbers,
    isSubmitting,
    isLoading: isLoadingProgress,
    progressError,
    markItemAsComplete
  } = useProgressTracker('numbers');

  // --- Text-to-Speech ---
  const speakText = (text) => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.pitch = 1.1;
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // --- Handle Number Click ---
  const handleNumberClick = (num) => {
    const word = numberToWord(num);
    setSelectedNumber({ num, word });
    setFeedback(null);
    setLastResult(null);
    speakText(word);
  };

  // --- Click handler for the "Mark Complete" button ---
  const handleMarkComplete = () => {
    if (!selectedNumber) return;
    
    const numberWord = selectedNumber.word;
    markItemAsComplete(numberWord, () => {
      console.log(`Progress saved for number: ${numberWord}`);
      speakText(`You learned ${numberWord}! Great job!`);
    });
  };

  // --- Recording Logic ---
  const startRecording = async () => {
    if (!selectedNumber) {
      alert("Please click a number first!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: "audio/webm;codecs=opus" 
      });
      let chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        sendAudioToBackend(blob, selectedNumber.word);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
      mediaRecorderRef.current = mediaRecorder;

      // Auto-stop after 3 seconds
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopRecording();
        }
      }, 3000);
    } catch (err) {
      console.error("🎤 Microphone error:", err);
      setIsRecording(false);
      alert("Please allow microphone access to use this feature!");
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Send Audio to Backend ---
  const sendAudioToBackend = async (blob, expectedText) => {
    if (!blob) return;
    
    setIsAnalyzing(true);
    setFeedback("Analyzing your pronunciation...");

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("expected_text", expectedText);
    formData.append("lesson_type", "numbers");
    
    // Add user_id if available
    const userId = localStorage.getItem('user_id');
    if (userId) {
      formData.append("user_id", userId);
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze_speech", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("📊 Speech result:", result);

      if (!result.success || result.error) {
        setFeedback(result.reward || "❌ Error analyzing speech, please try again!");
        setIsAnalyzing(false);
        return;
      }

      // Store result for modal
      setLastResult(result);
      
      // Update feedback
      setFeedback(result.reward);
      
      // Show modal with results
      setShowModal(true);

      // Auto-mark as completed if accuracy is good
      if (result.accuracy >= 75 && selectedNumber && !completedNumbers.has(selectedNumber.word)) {
        markItemAsComplete(selectedNumber.word, () => {
          console.log(`Auto-completed number: ${selectedNumber.word}`);
        });
      }

      // Play reward audio if available
      if (result.reward_audio) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${result.reward_audio}`);
          audio.play();
        } catch (err) {
          console.warn("Could not play reward audio:", err);
          speakText(result.reward);
        }
      } else {
        speakText(result.reward);
      }

    } catch (error) {
      console.error("❌ Error sending audio:", error);
      setFeedback("⚠️ Could not connect to server. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render stars based on result
  const renderStars = (stars) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`w-8 h-8 ${i <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Check if current number is completed
  const isCurrentNumberCompleted = selectedNumber ? completedNumbers.has(selectedNumber.word) : false;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-10 md:p-16 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 font-sans">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 mb-4 mt-10 text-center drop-shadow-lg">
        🔢 Learn Your Numbers!
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl px-2">
        Click any number to hear it — then press the mic and say it!
      </p>

      {/* --- Loading & Error States --- */}
      {isLoadingProgress && (
        <div className="flex justify-center items-center p-4 my-4 w-full max-w-5xl">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Loading progress...</span>
        </div>
      )}
      {progressError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-center font-semibold flex items-center justify-center space-x-2 max-w-5xl w-full">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {progressError}</span>
        </div>
      )}

      {/* Number Grid */}
      <div className="w-full max-w-4xl grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4 p-4 bg-white rounded-3xl shadow-2xl mb-6">
        {numbers.map((num) => {
          const numberWord = numberToWord(num);
          const isCompleted = completedNumbers.has(numberWord);
          const isSelected = selectedNumber?.num === num;

          return (
            <div
              key={num}
              onClick={() => handleNumberClick(num)}
              className={`flex flex-col items-center justify-center aspect-square rounded-xl p-1
                          transition-all duration-300 transform cursor-pointer relative
                          ${isCompleted
                            ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg"
                            : isSelected
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-110"
                            : "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 hover:scale-105 hover:shadow-md"
                          }`}
            >
              {/* Display the Number */}
              <span className="text-2xl sm:text-3xl font-bold mb-0 leading-none">{num}</span>
              
              {/* Display the Word (One, Two, etc.) */}
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight opacity-90">
                {numberWord}
              </span>

              {isCompleted && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white mt-1 absolute top-1 right-1" />}
              {isSelected && !isCompleted && (
                <div className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Number Display */}
      {selectedNumber && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Selected Number:</h3>
            <button
              onClick={() => speakText(selectedNumber.word)}
              className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
              title="Hear it again"
            >
              <Volume2 className="w-5 h-5 text-blue-600" />
            </button>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">{selectedNumber.num}</div>
            <div className="text-3xl font-semibold text-gray-700">{selectedNumber.word}</div>
          </div>

          {/* --- MARK COMPLETE BUTTON --- */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleMarkComplete}
              disabled={isCurrentNumberCompleted || isSubmitting}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold text-white text-sm
                          transition-all duration-300 shadow-lg transform
                          ${isCurrentNumberCompleted
                            ? "bg-gradient-to-r from-green-400 to-green-600 cursor-default"
                            : isSubmitting
                            ? "bg-indigo-400 cursor-not-allowed opacity-70"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 active:scale-95 hover:shadow-xl"
                          }`}
            >
              {isCurrentNumberCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>I learned this!</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recording Button */}
      <div className="flex flex-col items-center space-y-4 mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing || !selectedNumber}
          className={`flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-white text-lg
                      transition-all duration-300 shadow-lg transform
                      ${isRecording
                        ? "bg-red-500 animate-pulse scale-110"
                        : isAnalyzing
                        ? "bg-gray-400 cursor-not-allowed"
                        : !selectedNumber
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 active:scale-95 hover:shadow-xl"
                      }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : isRecording ? (
            <>
              <Mic className="w-6 h-6 animate-pulse" />
              <span>Recording... (Tap to stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span>🎤 Press & Speak</span>
            </>
          )}
        </button>

        {!selectedNumber && (
          <p className="text-sm text-gray-500 italic">
            👆 Click a number first to start practicing
          </p>
        )}
      </div>

      {/* Feedback Display */}
      {feedback && !showModal && (
        <div className="text-center max-w-md w-full">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-lg font-semibold">{feedback}</p>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showModal && lastResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4">{lastResult.emoji}</div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {lastResult.reward}
              </h2>

              <div className="mb-6">
                {renderStars(lastResult.stars)}
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">You said:</span>
                  <span className="font-bold text-gray-800">{lastResult.recognized_text}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Accuracy:</span>
                  <span className={`font-bold ${
                    lastResult.accuracy >= 90 ? "text-green-600" :
                    lastResult.accuracy >= 75 ? "text-blue-600" :
                    lastResult.accuracy >= 60 ? "text-yellow-600" : "text-orange-600"
                  }`}>
                    {lastResult.accuracy}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Points:</span>
                  <span className="font-bold text-purple-600">+{lastResult.points_added}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  if (selectedNumber) {
                    speakText(selectedNumber.word);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 rounded-xl
                           hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
          <Volume2 className="w-5 h-5" />
          <span className="font-semibold">Speaking...</span>
        </div>
      )}
    </div>
  );
};

export default NumLesson;