import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    CheckCircle2, AlertCircle, Loader2, Sparkles, Mic, Volume2, X, Star,
    ArrowLeft, ArrowRight 
} from 'lucide-react';
// Assume this hook is available in your project structure
import useProgressTracker from '../hooks/useProgressTracker'; 

// --------------------------------------------------------------------
// ⭐⭐⭐ COMPLETE ALPHABET DATA FOR ALL 26 LETTERS ⭐⭐⭐
// --------------------------------------------------------------------
const lettersData = [
  { 
    letter: 'A', 
    words: [
      { name: 'Apple', imageUrl: '🍏', description: 'A red fruit.' }, 
      { name: 'Ant', imageUrl: '🐜', description: 'A small insect.' },
      { name: 'Axe', imageUrl: '🪓', description: 'A cutting tool.' }
    ] 
  },
  { 
    letter: 'B', 
    words: [
      { name: 'Ball', imageUrl: '⚽', description: 'A round object.' }, 
      { name: 'Book', imageUrl: '📚', description: 'Something to read.' },
      { name: 'Bear', imageUrl: '🐻', description: 'A large animal.' }
    ] 
  },
  { 
    letter: 'C', 
    words: [
      { name: 'Cat', imageUrl: '🐈', description: 'A small pet.' }, 
      { name: 'Car', imageUrl: '🚗', description: 'A vehicle.' },
      { name: 'Cup', imageUrl: '☕', description: 'A drinking vessel.' }
    ] 
  },
  { 
    letter: 'D', 
    words: [
      { name: 'Dog', imageUrl: '🐕', description: 'Man\'s best friend.' }, 
      { name: 'Drum', imageUrl: '🥁', description: 'A musical instrument.' },
      { name: 'Duck', imageUrl: '🦆', description: 'A swimming bird.' }
    ] 
  },
  { 
    letter: 'E', 
    words: [
      { name: 'Egg', imageUrl: '🥚', description: 'A food from chickens.' }, 
      { name: 'Elephant', imageUrl: '🐘', description: 'A large grey animal.' },
      { name: 'Eye', imageUrl: '👁️', description: 'Used for seeing.' }
    ] 
  },
  { 
    letter: 'F', 
    words: [
      { name: 'Fish', imageUrl: '🐟', description: 'Lives in water.' }, 
      { name: 'Flower', imageUrl: '🌸', description: 'A colorful plant part.' },
      { name: 'Frog', imageUrl: '🐸', description: 'A green amphibian.' }
    ] 
  },
  { 
    letter: 'G', 
    words: [
      { name: 'Goat', imageUrl: '🐐', description: 'A farm animal.' }, 
      { name: 'Grape', imageUrl: '🍇', description: 'A small sweet fruit.' },
      { name: 'Guitar', imageUrl: '🎸', description: 'A stringed instrument.' }
    ] 
  },
  { 
    letter: 'H', 
    words: [
      { name: 'Hat', imageUrl: '👒', description: 'Worn on the head.' }, 
      { name: 'House', imageUrl: '🏠', description: 'A place to live.' },
      { name: 'Horse', imageUrl: '🐴', description: 'A riding animal.' }
    ] 
  },
  { 
    letter: 'I', 
    words: [
      { name: 'Ice', imageUrl: '🧊', description: 'Frozen water.' }, 
      { name: 'Igloo', imageUrl: '🧊', description: 'A snow house.' },
      { name: 'Island', imageUrl: '🏝️', description: 'Land surrounded by water.' }
    ] 
  },
  { 
    letter: 'J', 
    words: [
      { name: 'Jelly', imageUrl: '🍇', description: 'A sweet spread.' }, 
      { name: 'Jet', imageUrl: '✈️', description: 'A fast airplane.' },
      { name: 'Jacket', imageUrl: '🧥', description: 'Worn to keep warm.' }
    ] 
  },
  { 
    letter: 'K', 
    words: [
      { name: 'Key', imageUrl: '🔑', description: 'Used to open locks.' }, 
      { name: 'Kite', imageUrl: '🪁', description: 'Flies in the air.' },
      { name: 'King', imageUrl: '👑', description: 'A male ruler.' }
    ] 
  },
  { 
    letter: 'L', 
    words: [
      { name: 'Lion', imageUrl: '🦁', description: 'The king of the jungle.' }, 
      { name: 'Lamp', imageUrl: '💡', description: 'Gives light.' },
      { name: 'Leg', imageUrl: '🦵', description: 'Used for walking.' }
    ] 
  },
  { 
    letter: 'M', 
    words: [
      { name: 'Moon', imageUrl: '🌕', description: 'Shines at night.' }, 
      { name: 'Mouse', imageUrl: '🐭', description: 'A small rodent.' },
      { name: 'Milk', imageUrl: '🥛', description: 'A white drink.' }
    ] 
  },
  { 
    letter: 'N', 
    words: [
      { name: 'Nest', imageUrl: '🐦', description: 'A bird\'s home.' }, 
      { name: 'Nose', imageUrl: '👃', description: 'Used for smelling.' },
      { name: 'Net', imageUrl: '🥅', description: 'Used for catching things.' }
    ] 
  },
  { 
    letter: 'O', 
    words: [
      { name: 'Orange', imageUrl: '🍊', description: 'A citrus fruit.' }, 
      { name: 'Owl', imageUrl: '🦉', description: 'A nocturnal bird.' },
      { name: 'Octopus', imageUrl: '🐙', description: 'Has eight arms.' }
    ] 
  },
  { 
    letter: 'P', 
    words: [
      { name: 'Pig', imageUrl: '🐷', description: 'A farm animal.' }, 
      { name: 'Pencil', imageUrl: '✏️', description: 'Used for writing.' },
      { name: 'Pizza', imageUrl: '🍕', description: 'A popular food.' }
    ] 
  },
  { 
    letter: 'Q', 
    words: [
      { name: 'Queen', imageUrl: '👸', description: 'A female ruler.' }, 
      { name: 'Quilt', imageUrl: '🧵', description: 'A warm blanket.' },
      { name: 'Quack', imageUrl: '🦆', description: 'A duck sound.' }
    ] 
  },
  { 
    letter: 'R', 
    words: [
      { name: 'Rabbit', imageUrl: '🐇', description: 'A fast hopping animal.' }, 
      { name: 'Ring', imageUrl: '💍', description: 'Worn on a finger.' },
      { name: 'Rainbow', imageUrl: '🌈', description: 'Colors in the sky.' }
    ] 
  },
  { 
    letter: 'S', 
    words: [
      { name: 'Sun', imageUrl: '☀️', description: 'Shines in the day.' }, 
      { name: 'Shoe', imageUrl: '👟', description: 'Worn on the foot.' },
      { name: 'Star', imageUrl: '⭐', description: 'Twinkles in space.' }
    ] 
  },
  { 
    letter: 'T', 
    words: [
      { name: 'Tree', imageUrl: '🌳', description: 'A large plant.' }, 
      { name: 'Table', imageUrl: '🪑', description: 'A flat piece of furniture.' },
      { name: 'Train', imageUrl: '🚂', description: 'Travels on tracks.' }
    ] 
  },
  { 
    letter: 'U', 
    words: [
      { name: 'Umbrella', imageUrl: '☔', description: 'Used for rain.' }, 
      { name: 'Unicorn', imageUrl: '🦄', description: 'A mythical horse.' },
      { name: 'Up', imageUrl: '⬆️', description: 'Opposite of down.' }
    ] 
  },
  { 
    letter: 'V', 
    words: [
      { name: 'Van', imageUrl: '🚐', description: 'A large car.' }, 
      { name: 'Violin', imageUrl: '🎻', description: 'A musical instrument.' },
      { name: 'Volcano', imageUrl: '🌋', description: 'A mountain that erupts.' }
    ] 
  },
  { 
    letter: 'W', 
    words: [
      { name: 'Water', imageUrl: '💧', description: 'The liquid we drink.' }, 
      { name: 'Whale', imageUrl: '🐳', description: 'A large sea mammal.' },
      { name: 'Window', imageUrl: '🪟', description: 'A pane of glass.' }
    ] 
  },
  { 
    letter: 'X', 
    words: [
      { name: 'Xylophone', imageUrl: '🎶', description: 'A musical instrument.' }, 
      { name: 'X-ray', imageUrl: '🦴', description: 'A picture of bones.' },
      { name: 'Fox', imageUrl: '🦊', description: 'An animal ending in X.' }
    ] 
  },
  { 
    letter: 'Y', 
    words: [
      { name: 'Yacht', imageUrl: '⛵', description: 'A sailing boat.' }, 
      { name: 'Yellow', imageUrl: '🟡', description: 'A bright color.' },
      { name: 'Yo-yo', imageUrl: '⚫', description: 'A spinning toy.' }
    ] 
  },
  { 
    letter: 'Z', 
    words: [
      { name: 'Zebra', imageUrl: '🦓', description: 'A striped animal.' }, 
      { name: 'Zipper', imageUrl: '🪡', description: 'Used to close clothes.' },
      { name: 'Zoo', imageUrl: '🦒', description: 'Where animals live.' }
    ] 
  },
];

// NEW: Letter cards data for uppercase and lowercase
const alphabetLetters = lettersData.map(item => ({
  letter: item.letter,
  uppercase: item.letter,
  lowercase: item.letter.toLowerCase(),
  emoji: item.words[0].imageUrl // Use first word's emoji as reference
}));

// --- Custom 3D Text Style ---
const text3DStyle = {
    textShadow: 
        '1px 1px 0px #000000, 2px 2px 0px #209CEE, 3px 3px 0px #209CEE, 4px 4px 0px #000000, 5px 5px 0px #209CEE',
    transform: 'translateZ(0)', 
};


const AbcLesson = () => {
    // --- State Hooks ---
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCelebrating, setIsCelebrating] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    // NEW: State for letter card sections
    const [selectedUppercase, setSelectedUppercase] = useState(null);
    const [selectedLowercase, setSelectedLowercase] = useState(null);
    const [activeSection, setActiveSection] = useState('words'); // 'words', 'uppercase', 'lowercase'

    // --- Current Item Lookup ---
    const currentLetterItem = lettersData[currentLetterIndex];
    const currentWordItem = currentLetterItem.words[currentWordIndex];
    
    // --- Refs for recording and timers ---
    const mediaRecorderRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const promptTimerRef = useRef(null); 
    const chunksRef = useRef([]);

    // --- Progress Hook ---
    const { completedItems: completedWords, isSubmitting, markItemAsComplete } = useProgressTracker('abc');
    
    // NEW: Progress tracking for letter cards
    const [completedUppercase, setCompletedUppercase] = useState(new Set());
    const [completedLowercase, setCompletedLowercase] = useState(new Set());

    // --- Helper to get User ID ---
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
        return null;
    };

    // --------------------------------------------------------------------
    // TTS FUNCTION WITH OPTIONAL CALLBACK FOR TIMER RESET
    // --------------------------------------------------------------------
    const speakText = useCallback((text, onEndCallback = null) => {
        if (!('speechSynthesis' in window)) return;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.pitch = 1.3;
        utterance.rate = 0.85;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEndCallback) {
                onEndCallback();
            }
        };
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
    }, []);

    // --- 5-Second Auto-Speak ON CURRENT CARD (The Prompt/Review Loop) ---
    const startPromptCycle = useCallback(() => {
        if (promptTimerRef.current) {
            clearInterval(promptTimerRef.current);
        }
        
        let textToSpeak = '';
        if (activeSection === 'words') {
            textToSpeak = `${currentLetterItem.letter} for ${currentWordItem.name}`;
        } else if (activeSection === 'uppercase' && selectedUppercase) {
            textToSpeak = selectedUppercase.letter;
        } else if (activeSection === 'lowercase' && selectedLowercase) {
            textToSpeak = selectedLowercase.lowercase;
        }
        
        if (!textToSpeak) return;
        
        promptTimerRef.current = setInterval(() => {
            if (!isRecording && !isAnalyzing && !showModal && !isCelebrating) {
                speakText(textToSpeak);
            }
        }, 5000); 
        
    }, [activeSection, currentLetterItem.letter, currentWordItem.name, selectedUppercase, selectedLowercase, isRecording, isAnalyzing, showModal, isCelebrating, speakText]);

    // Restart the prompt cycle whenever the card content changes
    useEffect(() => {
        setIsCelebrating(false);
        setFeedback(null);
        setLastResult(null);
        
        // Speak immediately on card change
        if (activeSection === 'words') {
            speakText(`${currentLetterItem.letter} for ${currentWordItem.name}`);
        } else if (activeSection === 'uppercase' && selectedUppercase) {
            speakText(selectedUppercase.letter);
        } else if (activeSection === 'lowercase' && selectedLowercase) {
            speakText(selectedLowercase.lowercase);
        }
        
        startPromptCycle();
        
        return () => {
            if (promptTimerRef.current) {
                clearInterval(promptTimerRef.current);
            }
        };
    }, [activeSection, currentLetterIndex, currentWordIndex, selectedUppercase, selectedLowercase, currentLetterItem.letter, currentWordItem.name, speakText, startPromptCycle]);


    // --- NEW: Handle Letter Card Clicks ---
    const handleUppercaseClick = (letterObj) => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        setSelectedUppercase(letterObj);
        setSelectedLowercase(null);
        setActiveSection('uppercase');
        setFeedback(null);
        setLastResult(null);
    };

    const handleLowercaseClick = (letterObj) => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        setSelectedLowercase(letterObj);
        setSelectedUppercase(null);
        setActiveSection('lowercase');
        setFeedback(null);
        setLastResult(null);
    };

    // --- Handlers for Manual Navigation and Interaction ---
    const handleWordClick = (word, index) => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current); 
        setCurrentWordIndex(index);
        setActiveSection('words');
        setSelectedUppercase(null);
        setSelectedLowercase(null);
        setFeedback(null);
        setLastResult(null);
    };
        
    const handleNext = () => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        let nextWordIndex = currentWordIndex + 1;
        let nextLetterIndex = currentLetterIndex;

        if (nextWordIndex >= currentLetterItem.words.length) {
            nextWordIndex = 0;
            nextLetterIndex = (currentLetterIndex + 1) % lettersData.length; 
        }
        
        setCurrentWordIndex(nextWordIndex);
        setCurrentLetterIndex(nextLetterIndex);
        setActiveSection('words');
        setSelectedUppercase(null);
        setSelectedLowercase(null);
    };

    const handlePrevious = () => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current); 
        let prevWordIndex = currentWordIndex - 1;
        let prevLetterIndex = currentLetterIndex;

        if (prevWordIndex < 0) {
            prevLetterIndex = (currentLetterIndex - 1 + lettersData.length) % lettersData.length;
            prevWordIndex = lettersData[prevLetterIndex].words.length - 1;
        }
        
        setCurrentWordIndex(prevWordIndex);
        setCurrentLetterIndex(prevLetterIndex);
        setActiveSection('words');
        setSelectedUppercase(null);
        setSelectedLowercase(null);
    };

    // --- Progress Saving Trigger ---
    const handleMarkComplete = (itemName, section = 'words') => {
        if (section === 'words') {
            markItemAsComplete(itemName, () => { 
                speakText(`Excellent! You mastered ${itemName}!`);
                setIsCelebrating(true);
            });
        } else if (section === 'uppercase') {
            setCompletedUppercase(prev => new Set([...prev, itemName]));
            speakText(`Great! You learned uppercase ${itemName}!`);
            setIsCelebrating(true);
        } else if (section === 'lowercase') {
            setCompletedLowercase(prev => new Set([...prev, itemName]));
            speakText(`Awesome! You learned lowercase ${itemName}!`);
            setIsCelebrating(true);
        }
    };
    
    // --------------------------------------------------------------------
    // LISTEN BUTTON HANDLER WITH TIMER RESET
    // --------------------------------------------------------------------
    const handleListenClick = () => {
        if (promptTimerRef.current) {
            clearInterval(promptTimerRef.current);
        }

        let textToSpeak = '';
        if (activeSection === 'words') {
            textToSpeak = `${currentLetterItem.letter} for ${currentWordItem.name}`;
        } else if (activeSection === 'uppercase' && selectedUppercase) {
            textToSpeak = selectedUppercase.letter;
        } else if (activeSection === 'lowercase' && selectedLowercase) {
            textToSpeak = selectedLowercase.lowercase;
        }

        speakText(textToSpeak, () => {
            startPromptCycle();
        });
    };

    // --- NEW: Back to Words Lesson Handler ---
    const handleBackToWords = () => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        setActiveSection('words');
        setSelectedUppercase(null);
        setSelectedLowercase(null);
        setFeedback(null);
        setLastResult(null);
    };

    // --- Speech Recording & Analysis ---
    const startRecording = async () => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });

            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 128000 });

            chunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                if (blob.size < 2000) {
                    alert("No audio detected! Please speak louder or closer to the mic.");
                    stream.getTracks().forEach((t) => t.stop());
                    startPromptCycle();
                    return;
                }
                
                let expectedText = '';
                if (activeSection === 'words') {
                    expectedText = currentWordItem.name;
                } else if (activeSection === 'uppercase' && selectedUppercase) {
                    expectedText = selectedUppercase.letter;
                } else if (activeSection === 'lowercase' && selectedLowercase) {
                    expectedText = selectedLowercase.lowercase;
                }
                
                sendAudioToBackend(blob, expectedText);
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setFeedback(null);
            mediaRecorderRef.current = mediaRecorder;

            recordingTimerRef.current = setTimeout(() => {
                if (mediaRecorder.state === "recording") stopRecording();
            }, 4000);

        } catch (err) {
            console.error("🎤 Mic error:", err);
            alert("Please allow microphone access!");
            startPromptCycle(); 
        }
    };

    const stopRecording = () => {
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToBackend = async (blob, expectedText) => {
        setIsAnalyzing(true);
        setFeedback("Analyzing your pronunciation...");

        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("expected_text", expectedText);
        formData.append("lesson_type", "abc");
        
        const userId = getUserId();
        if (userId) formData.append("user_id", userId);

        try {
            const response = await fetch("http://127.0.0.1:5000/analyze_speech", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Server error");

            const result = await response.json();
            setLastResult(result);
            setFeedback(result.reward);
            setShowModal(true);

            // --- AUTO-SAVE PROGRESS ON HIGH ACCURACY ---
            if (result.accuracy >= 75) {
                if (activeSection === 'words' && currentWordItem && !completedWords.has(currentWordItem.name)) {
                    handleMarkComplete(currentWordItem.name, 'words');
                } else if (activeSection === 'uppercase' && selectedUppercase && !completedUppercase.has(selectedUppercase.letter)) {
                    handleMarkComplete(selectedUppercase.letter, 'uppercase');
                } else if (activeSection === 'lowercase' && selectedLowercase && !completedLowercase.has(selectedLowercase.lowercase)) {
                    handleMarkComplete(selectedLowercase.lowercase, 'lowercase');
                }
            } else {
                setIsCelebrating(false);
            }

            if (result.reward_audio) {
                const audio = new Audio(`data:audio/mp3;base64,${result.reward_audio}`);
                audio.play();
            } else {
                speakText(result.reward);
            }

        } catch (err) {
            console.error("❌ Error:", err);
            setFeedback("⚠ Cannot connect to server.");
            setIsCelebrating(false);
        } finally {
            setIsAnalyzing(false);
        }
    };


    const renderStars = (stars) => (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3].map(i => (
                <Star key={i} className={`w-8 h-8 ${i <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
        </div>
    );

    // Get current selection details
    const getCurrentExpectedText = () => {
        if (activeSection === 'words') return currentWordItem.name;
        if (activeSection === 'uppercase' && selectedUppercase) return selectedUppercase.letter;
        if (activeSection === 'lowercase' && selectedLowercase) return selectedLowercase.lowercase;
        return '';
    };

    const getCurrentSelection = () => {
        if (activeSection === 'words') return currentWordItem;
        if (activeSection === 'uppercase') return selectedUppercase;
        if (activeSection === 'lowercase') return selectedLowercase;
        return null;
    };

    // --- UI ---
    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-8 bg-blue-50 font-sans">
            
            {/* --- Custom CSS for Animations --- */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1.0) translateZ(0); }
                    50% { transform: scale(1.05) translateZ(10px); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite; 
                }
                @keyframes tada { 
                    0% { transform: scale(1) rotate(0deg); } 
                    10%, 20% { transform: scale(0.9) rotate(-3deg); } 
                    30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 
                    40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 
                    100% { transform: scale(1) rotate(0deg); } 
                }
                .animate-tada {
                    animation: tada 1s ease-in-out;
                }
            `}</style>
            
            {/* --- Header --- */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 mb-6 mt-10 text-center">
                🅰️ B C Lesson! 🎶
            </h1>

            {/* NEW: Uppercase Letters Card Section (A-Z) */}
            <div className="w-full max-w-6xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">📝 Uppercase Letters (A-Z)</h2>
                    {activeSection !== 'words' && (
                        <button
                            onClick={handleBackToWords}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Lessons</span>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 sm:gap-3 p-4 bg-white rounded-3xl shadow-2xl">
                    {alphabetLetters.map((letterObj) => {
                        const isCompleted = completedUppercase.has(letterObj.uppercase);
                        const isSelected = selectedUppercase?.letter === letterObj.uppercase;

                        return (
                            <div
                                key={`upper-${letterObj.uppercase}`}
                                onClick={() => handleUppercaseClick(letterObj)}
                                className={`flex flex-col items-center justify-center aspect-square rounded-xl text-2xl sm:text-3xl font-bold
                                            transition-all duration-300 transform cursor-pointer relative
                                            ${isCompleted
                                                ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg"
                                                : isSelected
                                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-110"
                                                : "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 hover:scale-105 hover:shadow-md"
                                            }`}
                            >
                                <span>{letterObj.uppercase}</span>
                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-white mt-1" />}
                                {isSelected && !isCompleted && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* NEW: Lowercase Letters Card Section (a-z) */}
            <div className="w-full max-w-6xl mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">✍️ Lowercase Letters (a-z)</h2>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 sm:gap-3 p-4 bg-white rounded-3xl shadow-2xl">
                    {alphabetLetters.map((letterObj) => {
                        const isCompleted = completedLowercase.has(letterObj.lowercase);
                        const isSelected = selectedLowercase?.lowercase === letterObj.lowercase;

                        return (
                            <div
                                key={`lower-${letterObj.lowercase}`}
                                onClick={() => handleLowercaseClick(letterObj)}
                                className={`flex flex-col items-center justify-center aspect-square rounded-xl text-2xl sm:text-3xl font-bold
                                            transition-all duration-300 transform cursor-pointer relative
                                            ${isCompleted
                                                ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg"
                                                : isSelected
                                                ? "bg-gradient-to-br from-pink-500 to-orange-600 text-white shadow-xl scale-110"
                                                : "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 hover:scale-105 hover:shadow-md"
                                            }`}
                            >
                                <span>{letterObj.lowercase}</span>
                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-white mt-1" />}
                                {isSelected && !isCompleted && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Main Lesson Card (A for Apple format) --- */}
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
                
                {activeSection === 'words' ? (
                    <>
                        {/* --- Main Letter and Word Display --- */}
                        <div className="flex flex-col sm:flex-row items-center justify-around mb-6 border-b pb-4 border-blue-100">
                            
                            {/* 3D Letter Icon */}
                            <div className="sm:w-1/3 text-center mb-4 sm:mb-0">
                                <div 
                                    className={`inline-block text-[150px] font-black leading-none 
                                        ${isCelebrating ? 'animate-tada' : 'animate-pulse-slow'}`
                                    } 
                                    style={{
                                        background: 'linear-gradient(45deg, #3b82f6, #06b6d4, #10b981)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        ...text3DStyle,
                                        transformOrigin: 'center center'
                                    }}>
                                    {currentLetterItem.letter}
                                </div>
                            </div>

                            {/* Word, Image, and Description */}
                            <div className="sm:w-2/3 flex flex-col items-center justify-center space-y-3">
                                
                                {/* LARGE AND ANIMATED IMAGE ICON */}
                                <div 
                                    className={`text-[100px] leading-none ${isCelebrating ? 'animate-tada' : 'animate-bounce-slow'}`}
                                >
                                    {currentWordItem.imageUrl}
                                </div>

                                <div className="text-5xl font-extrabold text-gray-700">{currentWordItem.name}</div>
                                <p className="text-md text-gray-500 italic">{currentWordItem.description}</p>
                            </div>
                        </div>

                        {/* --- Current Letter's Words Navigation (Horizontal Selectors) --- */}
                        <div className="flex justify-center flex-wrap gap-3 mb-6">
                            {currentLetterItem.words.map((word, index) => {
                                const isSelected = index === currentWordIndex;
                                const isCompleted = completedWords.has(word.name);
                                
                                return (
                                    <button
                                        key={word.name}
                                        onClick={() => handleWordClick(word, index)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all duration-200
                                            ${isSelected ? "bg-blue-600 text-white ring-4 ring-blue-300 shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-blue-100"}
                                            ${isCompleted ? "border-2 border-green-500" : ""}
                                        `}
                                    >
                                        <span>{word.name}</span>
                                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400 fill-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : activeSection === 'uppercase' && selectedUppercase ? (
                    <div className="text-center py-10">
                        <div 
                            className={`inline-block text-[180px] font-black leading-none mb-6 ${isCelebrating ? 'animate-tada' : 'animate-pulse-slow'}`}
                            style={{
                                background: 'linear-gradient(45deg, #3b82f6, #06b6d4, #10b981)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                ...text3DStyle
                            }}>
                            {selectedUppercase.uppercase}
                        </div>
                        <div className="text-4xl font-bold text-gray-700 mb-2">Capital Letter</div>
                        <p className="text-lg text-gray-500">Practice saying: <span className="font-bold text-2xl">"{selectedUppercase.uppercase}"</span></p>
                    </div>
                ) : activeSection === 'lowercase' && selectedLowercase ? (
                    <div className="text-center py-10">
                        <div 
                            className={`inline-block text-[180px] font-black leading-none mb-6 ${isCelebrating ? 'animate-tada' : 'animate-pulse-slow'}`}
                            style={{
                                background: 'linear-gradient(45deg, #ec4899, #f97316, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                ...text3DStyle
                            }}>
                            {selectedLowercase.lowercase}
                        </div>
                        <div className="text-4xl font-bold text-gray-700 mb-2">Small Letter</div>
                        <p className="text-lg text-gray-500">Practice saying: <span className="font-bold text-2xl">"{selectedLowercase.lowercase}"</span></p>
                    </div>
                ) : null}

                {/* --- Listen, Record, and Mastered Actions --- */}
                <div className="flex justify-center items-center space-x-4 sm:space-x-6 mt-6">
                    
                    {/* Listen Button */}
                    <button 
                        onClick={handleListenClick}
                        disabled={!getCurrentSelection()}
                        className={`p-4 rounded-full transition-all duration-300 shadow-md 
                        ${isSpeaking ? "bg-pink-400 scale-110 animate-bounce" : "bg-pink-500 hover:scale-105"}
                        ${!getCurrentSelection() ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Volume2 className="w-8 h-8 text-white" />
                    </button>
                    
                    {/* Recording Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isAnalyzing || isSubmitting || !getCurrentSelection()}
                        className={`flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-white text-lg
                            ${isRecording ? "bg-red-500 animate-pulse scale-110"
                                : isAnalyzing ? "bg-gray-400 cursor-not-allowed"
                                : !getCurrentSelection() ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-105"}
                        `}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : isRecording ? (
                            <>
                                <Mic className="w-6 h-6" />
                                <span>Recording...</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-6 h-6" />
                                <span>🎤 Say "{getCurrentExpectedText()}"</span>
                            </>
                        )}
                    </button>
                    
                    {/* I've Mastered This / Learned It Button */}
                    <button
                        onClick={() => {
                            if (activeSection === 'words') {
                                handleMarkComplete(currentWordItem.name, 'words');
                            } else if (activeSection === 'uppercase' && selectedUppercase) {
                                handleMarkComplete(selectedUppercase.letter, 'uppercase');
                            } else if (activeSection === 'lowercase' && selectedLowercase) {
                                handleMarkComplete(selectedLowercase.lowercase, 'lowercase');
                            }
                        }}
                        disabled={
                            (activeSection === 'words' && completedWords.has(currentWordItem.name)) ||
                            (activeSection === 'uppercase' && selectedUppercase && completedUppercase.has(selectedUppercase.letter)) ||
                            (activeSection === 'lowercase' && selectedLowercase && completedLowercase.has(selectedLowercase.lowercase)) ||
                            isSubmitting || !getCurrentSelection()
                        }
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-4 rounded-full font-bold text-lg transition-all duration-200 shadow-md 
                            ${(activeSection === 'words' && completedWords.has(currentWordItem.name)) ||
                              (activeSection === 'uppercase' && selectedUppercase && completedUppercase.has(selectedUppercase.letter)) ||
                              (activeSection === 'lowercase' && selectedLowercase && completedLowercase.has(selectedLowercase.lowercase))
                                ? "bg-green-300 text-green-800 cursor-not-allowed"
                                : !getCurrentSelection()
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105"
                            }`}
                    >
                        <Sparkles className="w-6 h-6" />
                        <span className='hidden sm:inline'>Mastered!</span>
                        <span className='inline sm:hidden'>Done!</span>
                    </button>
                </div>

                {!getCurrentSelection() && (
                    <p className="text-center text-gray-500 mt-4 italic">👆 Click a letter card above to start practicing</p>
                )}
            </div>
            
            {/* --- Global Navigation Buttons (Next/Previous Card) --- */}
            {activeSection === 'words' && (
                <div className="flex justify-between w-full max-w-4xl mt-4">
                    <button
                        onClick={handlePrevious}
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-xl text-gray-800 font-bold transition-colors shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Previous</span>
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold transition-colors shadow-lg"
                    >
                        <span>Next</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* --- Results Modal (for pronunciation feedback) --- */}
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
                            {activeSection === 'words' ? (
                                <>
                                    <div className="text-6xl font-black text-blue-600 mb-2">{currentLetterItem.letter}</div>
                                    <div className="text-4xl font-extrabold text-gray-700 mb-4">{currentWordItem.name} {currentWordItem.imageUrl}</div>
                                </>
                            ) : activeSection === 'uppercase' && selectedUppercase ? (
                                <div className="text-8xl font-black text-blue-600 mb-4">{selectedUppercase.uppercase}</div>
                            ) : activeSection === 'lowercase' && selectedLowercase ? (
                                <div className="text-8xl font-black text-pink-600 mb-4">{selectedLowercase.lowercase}</div>
                            ) : null}

                            <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                {lastResult.reward}
                            </h2>

                            {renderStars(lastResult.stars)}

                            <div className="bg-gray-100 rounded-xl p-4 mt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>You said:</span>
                                    <span className="font-bold">{lastResult.recognized_text}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Accuracy:</span>
                                    <span className="font-bold text-blue-600">{lastResult.accuracy}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Points:</span>
                                    <span className="font-bold text-blue-600">+{lastResult.points_added}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (activeSection === 'words') {
                                        speakText(`${currentLetterItem.letter} for ${currentWordItem.name}`, startPromptCycle);
                                    } else if (activeSection === 'uppercase' && selectedUppercase) {
                                        speakText(selectedUppercase.letter, startPromptCycle);
                                    } else if (activeSection === 'lowercase' && selectedLowercase) {
                                        speakText(selectedLowercase.lowercase, startPromptCycle);
                                    }
                                }}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-3 rounded-xl mt-6"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Speaking Indicator */}
            {isSpeaking && (
                <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
                    <Volume2 className="w-5 h-5 inline mr-2" /> Speaking...
                </div>
            )}

        </div>
    );
};

export default AbcLesson;