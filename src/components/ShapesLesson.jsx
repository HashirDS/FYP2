import React, { useState, useRef } from 'react';
// --- Icons for progress tracking ---
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Mic, Volume2, X, Star } from 'lucide-react';
// --- Import the custom progress tracking hook ---
import useProgressTracker from '../hooks/useProgressTracker';

// Shape data (Emoji display used primarily)
const shapes = [
    { name: 'Circle', emoji: '⚪', color: 'text-red-500' },
    { name: 'Square', emoji: '🟥', color: 'text-blue-500' },
    { name: 'Triangle', emoji: '🔺', color: 'text-green-500' },
    { name: 'Star', emoji: '⭐', color: 'text-yellow-500' },
    { name: 'Heart', emoji: '❤️', color: 'text-pink-500' },
    { name: 'Diamond', emoji: '💎', color: 'text-teal-500' },
    { name: 'Moon', emoji: '🌙', color: 'text-indigo-400' },
    { name: 'Sun', emoji: '☀️', color: 'text-orange-400' },
    { name: 'Cloud', emoji: '☁️', color: 'text-gray-400' },
    { name: 'Lightning', emoji: '⚡', color: 'text-yellow-600' },
];

const ShapesLesson = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [selectedShape, setSelectedShape] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const recordingTimerRef = useRef(null);

    // --- Get user_id from localStorage (assuming you store it after login) ---
    const getUserId = () => {
        // Try to get user_id from different possible storage locations
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.user_id || user.id;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Alternative: check if user_id is stored directly
        const userId = localStorage.getItem('user_id');
        if (userId) return userId;
        
        // If no user_id found, return null (speech data won't be associated with user)
        console.warn('No user_id found. Speech data will not be saved to user profile.');
        return null;
    };

    // --- Initialize the progress hook for the 'shapes' category ---
    const {
        completedItems: completedShapes,
        isSubmitting,
        isLoading: isLoadingProgress,
        progressError,
        markItemAsComplete
    } = useProgressTracker('shapes');

    // --- Use Browser Speech Synthesis ---
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
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            setIsSpeaking(false);
        }
        speechSynthesis.speak(utterance);
    };

    // --- Click handler for shape card ---
    const handleShapeClick = (shape) => {
        setSelectedShape(shape);
        setFeedback(null);
        setLastResult(null);
        speakText(shape.name);
    };

    // --- Click handler for the "Mark Complete" button ---
    const handleMarkComplete = (shapeName) => {
        markItemAsComplete(shapeName, () => {
            console.log(`Progress saved for shape: ${shapeName}`);
            speakText(`You learned the ${shapeName}! Great job!`);
        });
    };

    // --- Recording Logic ---
    const startRecording = async () => {
        if (!selectedShape) {
            alert("Please click a shape first!");
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
                sendAudioToBackend(blob, selectedShape.name);
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
        formData.append("lesson_type", "shapes");
        
        // --- FIX: Add user_id to formData ---
        const userId = getUserId();
        if (userId) {
            formData.append("user_id", userId);
            console.log(`📝 Sending speech data for user: ${userId}`);
        } else {
            console.warn('⚠️ No user_id available. Speech data will not be saved to user profile.');
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

            // Auto-mark as completed if accuracy is good (in addition to manual button)
            if (result.accuracy >= 75 && selectedShape && !completedShapes.has(selectedShape.name)) {
                markItemAsComplete(selectedShape.name, () => {
                    console.log(`Auto-completed shape: ${selectedShape.name}`);
                });
            }

            // Play reward audio if available
            if (result.reward_audio) {
                try {
                    const audio = new Audio(`data:audio/mp3;base64,${result.reward_audio}`);
                    audio.play();
                } catch (err) {
                    console.warn("Could not play reward audio:", err);
                    // Fallback to text-to-speech
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

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-10 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 font-sans">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-700 mb-6 mt-10 text-center">
                🌟 Meet the Shapes! 🌟
            </h1>
            <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl px-2">
                Click a shape to hear it — then press the mic and say it! Or mark it as learned when you're ready.
            </p>

            {/* User ID Status */}
            {!getUserId() && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl mb-6 text-center">
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                    <strong>Note:</strong> You need to be logged in to save your speech progress.
                </div>
            )}

            {/* --- Loading & Error States --- */}
            {isLoadingProgress && (
                <div className="flex justify-center items-center p-4 my-4 w-full max-w-5xl">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-500">Loading progress...</span>
                </div>
            )}
            {progressError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-center font-semibold flex items-center justify-center space-x-2 max-w-5xl w-full">
                    <AlertCircle className="w-5 h-5" />
                    <span>Error loading/saving progress: {progressError}</span>
                </div>
            )}

            {/* --- Shapes Grid --- */}
            {!isLoadingProgress && (
                <div className="w-full max-w-5xl grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 p-4 bg-white rounded-3xl shadow-2xl mb-6">
                    {shapes.map((shape) => {
                        const isCompleted = completedShapes.has(shape.name);
                        const isSelected = selectedShape?.name === shape.name;

                        return (
                            <div
                                key={shape.name}
                                className={`flex flex-col items-center justify-between p-4 rounded-xl text-center shadow-md bg-gray-50
                                            transition-all duration-300 transform relative overflow-hidden h-48 sm:h-56 group
                                            ${isCompleted ? 'ring-4 ring-green-500 ring-offset-2 scale-105 bg-green-50' : ''}
                                            ${isSelected ? 'ring-4 ring-purple-500 ring-offset-2 scale-105 bg-purple-50' : 'hover:scale-105 hover:shadow-lg'}
                                            ${isSubmitting && !isCompleted ? 'opacity-70 pointer-events-none' : ''}`}
                            >
                                {/* Clickable area for speaking */}
                                <div
                                    className="flex-grow flex flex-col items-center justify-center cursor-pointer w-full"
                                    onClick={() => handleShapeClick(shape)}
                                    aria-label={`Hear the shape ${shape.name}`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleShapeClick(shape)}
                                >
                                    {/* Emoji Display */}
                                    <div className={`text-6xl sm:text-7xl md:text-8xl mb-2 transition-transform duration-300 ${isSpeaking && isSelected ? 'scale-110' : ''} ${shape.color}`}
                                         style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))' }}
                                    >
                                        {shape.emoji}
                                    </div>
                                    {/* Shape Name */}
                                    <p className={`mt-1 text-lg sm:text-xl font-bold ${shape.color}`}>
                                        {shape.name}
                                    </p>
                                </div>

                                {/* Spinner overlay while submitting THIS shape */}
                                {isSubmitting && completedShapes.has(shape.name) === false && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl z-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-white"/>
                                    </div>
                                )}

                                {/* Selected indicator */}
                                {isSelected && !isCompleted && (
                                    <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                                )}

                                {/* Mark as Complete Button */}
                                <button
                                    onClick={() => handleMarkComplete(shape.name)}
                                    disabled={isCompleted || isSubmitting}
                                    aria-label={`Mark ${shape.name} as learned`}
                                    className={`mt-2 w-full flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm z-20 ${
                                        isCompleted
                                        ? 'bg-green-600 text-white cursor-default'
                                        : isSubmitting
                                            ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                                            : 'bg-white/90 hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 focus:opacity-100'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                    ) : isSubmitting ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3 h-3" />
                                    )}
                                    <span>{isCompleted ? 'Done!' : 'Learned!'}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Selected Shape Display */}
            {selectedShape && (
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 max-w-md w-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">Selected Shape:</h3>
                        <button
                            onClick={() => speakText(selectedShape.name)}
                            className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                            title="Hear it again"
                        >
                            <Volume2 className="w-5 h-5 text-purple-600" />
                        </button>
                    </div>
                    <div className="text-center">
                        <div className="text-6xl font-bold mb-2">{selectedShape.emoji}</div>
                        <div className="text-3xl font-semibold text-gray-700">{selectedShape.name}</div>
                    </div>
                </div>
            )}

            {/* Recording Button */}
            <div className="flex flex-col items-center space-y-4 mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing || !selectedShape}
                    className={`flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-white text-lg
                                transition-all duration-300 shadow-lg transform
                                ${isRecording
                                    ? "bg-red-500 animate-pulse scale-110"
                                    : isAnalyzing
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : !selectedShape
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

                {!selectedShape && (
                    <p className="text-sm text-gray-500 italic">
                        👆 Click a shape first to start practicing
                    </p>
                )}
            </div>

            {/* Feedback Display */}
            {feedback && !showModal && (
                <div className="text-center max-w-md w-full">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl px-6 py-4 shadow-lg">
                        <p className="text-lg font-semibold">{feedback}</p>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showModal && lastResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-bounce-in">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>

                        <div className="text-center">
                            <div className="text-6xl mb-4">{selectedShape?.emoji}</div>
                            
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
                                {getUserId() && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Saved to:</span>
                                        <span className="font-bold text-green-600">Your Profile ✓</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (selectedShape) {
                                        speakText(selectedShape.name);
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
                <div className="fixed bottom-8 right-8 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
                    <Volume2 className="w-5 h-5" />
                    <span className="font-semibold">Speaking...</span>
                </div>
            )}
        </div>
    );
};

export default ShapesLesson;