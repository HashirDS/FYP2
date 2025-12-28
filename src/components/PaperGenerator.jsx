import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Trophy, Target, Clock, CheckCircle, XCircle, ArrowRight, 
  RotateCcw, Star, Award, Mic, Keyboard, Loader2, Sparkles, 
  BrainCircuit, Volume2, Lock, KeyRound 
} from 'lucide-react';

import QuizHistory from './QuizHistory';

// --- 1. CONFIGURATION ---
const API_URL = 'http://127.0.0.1:5000';

// ============================================================================
// 2. SMART VOICE CORRECTION
// ============================================================================
const smartVoiceCorrection = (transcript, expectedAnswer) => {
    if (!transcript || !expectedAnswer) return transcript;

    const t = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
    const e = String(expectedAnswer).toLowerCase().trim();

    if (e.length === 1 && e.match(/[a-z]/i)) {
        const letterMappings = {
            'a': ['hey', 'ay', 'ate', 'eight', 'bangladeshi', 'eh', 'apple', 'aa', 'are', 'day', 'play'],
            'b': ['be', 'bee', 'beat', 'me', 'bay'],
            'c': ['see', 'sea', 'she', 'si', 'say'],
            'd': ['dee', 'the', 'did', 'day'],
            'e': ['ee', 'eat', 'he', 'me'],
            'f': ['eff', 'if', 'off', 'half'],
            'g': ['jee', 'gee', 'ji', 'she'],
            'h': ['etch', 'age', 'each', 'edge'],
            'i': ['eye', 'ai', 'hi', 'aye', 'high'],
            'j': ['jay', 'gay', 'day'],
            'k': ['kay', 'key', 'okay', 'cake'],
            'l': ['el', 'ell', 'help', 'hell'],
            'm': ['em', 'am', 'ham', 'them'],
            'n': ['en', 'an', 'and', 'end', 'in'],
            'o': ['oh', 'owe', 'zero', 'no'],
            'p': ['pee', 'pea', 'pay'],
            'q': ['cue', 'queue', 'cute', 'you'],
            'r': ['are', 'our', 'hour', 'power'],
            's': ['es', 'yes', 'ess', 'ass'],
            't': ['tea', 'tee', 'sea'],
            'u': ['you', 'ewe', 'yew', 'hue'],
            'v': ['vee', 'we', 'be'],
            'w': ['double', 'double u'],
            'x': ['ex', 'axe', 'text'],
            'y': ['why', 'wye', 'while'],
            'z': ['zee', 'zed', 'sea', 'said']
        };
        if (letterMappings[e]?.includes(t)) return expectedAnswer;
        if (t.startsWith(e + " ")) return expectedAnswer;
        if (t.endsWith(" " + e)) return expectedAnswer;
    }

    const numberMappings = {
        '1': ['one', 'won', 'wan'], '2': ['two', 'to', 'too'], '3': ['three', 'tree', 'free'],
        '4': ['four', 'for', 'fore'], '5': ['five', 'hive', 'fi'], '6': ['six', 'sex', 'sick'],
        '7': ['seven'], '8': ['eight', 'ate'], '9': ['nine', 'nein', 'night'], '10': ['ten', 'tin', 'hen']
    };

    if (numberMappings[e] && numberMappings[e].includes(t)) return expectedAnswer;
    return transcript;
};

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================
const normalizeText = (text) => {
    if (!text) return { original: '', asWord: '', asDigit: '' };
    let str = String(text).toLowerCase().trim().replace(/[.,!?]/g, '');
    const numberMap = { 'zero':'0', 'one':'1', 'two':'2', 'three':'3', 'four':'4', 'five':'5', 'six':'6', 'seven':'7', 'eight':'8', 'nine':'9', 'ten':'10' };
    return { 
        original: str, 
        asWord: numberMap[str] || str, 
        asDigit: Object.keys(numberMap).find(key => numberMap[key] === str) || str 
    };
};

const checkAnswer = (studentAnswer, correctAnswer) => {
    const correctedAnswer = smartVoiceCorrection(studentAnswer, correctAnswer);
    const student = normalizeText(correctedAnswer);
    const correct = normalizeText(correctAnswer);
    return student.original === correct.original || 
           student.original === correct.asWord || 
           student.original === correct.asDigit ||
           student.asWord === correct.original;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================================================
// 4. COMPLETE TEACHER CURRICULUM (YOUR ORIGINAL DATA)
// ============================================================================
const QUESTION_BANK = {
  abc: {
    name: 'Alphabets', icon: '🔤',
    subCategories: {
      'Step 1 (A-E)': { questions: [{ question: 'Which letter is A?', correct: 'A', options: ['A', 'B', 'C', 'D'], image: '🅰️', skill: 'Recognition' }, { question: 'Say "Apple"', correct: 'Apple', image: '🍎', skill: 'Speaking' }, { question: 'Say the letter B', correct: 'B', image: '🅱️', skill: 'Speaking' }, { question: 'C is for...', correct: 'Cat', options: ['Cat', 'Dog', 'Fish'], image: '🐱', skill: 'Association' }, { question: 'Say letter E', correct: 'E', image: '📧', skill: 'Speaking' }] },
      'Step 2 (F-J)': { questions: [{ question: 'Find letter F', correct: 'F', options: ['F', 'G', 'H', 'I'], image: '🎏', skill: 'Recognition' }, { question: 'Say "Fish"', correct: 'Fish', image: '🐟', skill: 'Speaking' }, { question: 'Type letter G', correct: 'G', image: '🍇', skill: 'Writing' }, { question: 'J is for...', correct: 'Jug', options: ['Jug', 'Mug', 'Bug'], image: '🏺', skill: 'Association' }] },
      'Step 3 (K-O)': { questions: [{ question: 'Find K', correct: 'K', options: ['K', 'L', 'M', 'N'], image: '🪁', skill: 'Recognition' }, { question: 'Say "Orange"', correct: 'Orange', image: '🍊', skill: 'Speaking' }] },
      'Step 4 (P-T)': { questions: [{ question: 'Say "Pencil"', correct: 'Pencil', image: '✏️', skill: 'Speaking' }, { question: 'Find T', correct: 'T', options: ['T', 'I', 'L', 'F'], image: '☕', skill: 'Recognition' }] },
      'Step 5 (U-Z)': { questions: [{ question: 'Type Z', correct: 'Z', image: '🦓', skill: 'Writing' }, { question: 'Say "Umbrella"', correct: 'Umbrella', image: '☂️', skill: 'Speaking' }] },
      'Full A-Z Test': { questions: [{ question: 'Which is M?', correct: 'M', options: ['M', 'W', 'N', 'H'], image: 'Ⓜ️', skill: 'Recognition' }, { question: 'Say "Zebra"', correct: 'Zebra', image: '🦓', skill: 'Speaking' }] }
    }
  },
  numbers: {
    name: 'Numbers', icon: '🔢',
    subCategories: {
      'Level 1 (1-10)': { questions: [{ question: 'Touch number 5', correct: '5', options: ['3', '5', '7', '9'], image: '5️⃣', skill: 'Recognition' }, { question: 'Count the stars: ⭐⭐', correct: '2', image: '⭐⭐', skill: 'Counting' }, { question: 'Say "Ten"', correct: '10', image: '🔟', skill: 'Speaking' }, { question: 'Type number 1', correct: '1', image: '1️⃣', skill: 'Writing' }] },
      'Level 2 (11-20)': { questions: [{ question: 'Find 15', correct: '15', options: ['12', '15', '18', '20'], image: '1️⃣5️⃣', skill: 'Recognition' }, { question: 'Say "Twenty"', correct: '20', image: '2️⃣0️⃣', skill: 'Speaking' }] },
      'Level 3 (20-50)': { questions: [{ question: 'Type 30', correct: '30', image: '3️⃣0️⃣', skill: 'Writing' }, { question: 'What comes after 49?', correct: '50', options: ['48', '50', '51'], image: '❓', skill: 'Logic' }] },
      'Level 4 (50-100)': { questions: [{ question: 'Find 100', correct: '100', options: ['10', '100', '1000'], image: '💯', skill: 'Recognition' }] },
      'Full 1-100 Test': { questions: [{ question: 'Count by 10s: 10, 20, 30...', correct: '40', options: ['35', '40', '41'], image: '📈', skill: 'Logic' }] }
    }
  },
  days: { name: 'Days & Months', icon: '📅', subCategories: { 'Days of Week': { questions: [{ question: 'What comes after Sunday?', correct: 'Monday', options: ['Tuesday', 'Monday', 'Friday'], image: '🗓️', skill: 'Logic' }, { question: 'Say "Friday"', correct: 'Friday', image: '🎉', skill: 'Speaking' }, { question: 'How many days in a week?', correct: '7', options: ['5', '7', '10'], image: '📅', skill: 'Knowledge' }] }, 'Months': { questions: [{ question: 'First month of the year?', correct: 'January', options: ['May', 'January', 'December'], image: '❄️', skill: 'Knowledge' }, { question: 'Last month of the year?', correct: 'December', options: ['January', 'December', 'June'], image: '🎄', skill: 'Knowledge' }] } } },
  colors: { name: 'Colors', icon: '🎨', subCategories: { 'Primary Colors': { questions: [{ question: 'Touch Red', correct: 'Red', options: ['Red', 'Blue', 'Yellow'], image: '🔴', skill: 'Identification' }, { question: 'Say "Blue"', correct: 'Blue', image: '🔵', skill: 'Speaking' }, { question: 'Find Yellow', correct: 'Yellow', options: ['Red', 'Yellow', 'Green'], image: '🟡', skill: 'Identification' }] }, 'All Colors': { questions: [{ question: 'Color of Grass?', correct: 'Green', options: ['Green', 'Red', 'Pink'], image: '🌿', skill: 'Association' }, { question: 'Type "Pink"', correct: 'Pink', image: '🎀', skill: 'Writing' }, { question: 'Say "Purple"', correct: 'Purple', image: '🍇', skill: 'Speaking' }] } } },
  shapes: { name: 'Shapes', icon: '⬛', subCategories: { 'Basic Shapes': { questions: [{ question: 'Find the Circle', correct: 'Circle', options: ['Circle', 'Square', 'Star'], image: '⚪', skill: 'Recognition' }, { question: 'Say "Square"', correct: 'Square', image: '⬛', skill: 'Speaking' }] }, 'Advanced': { questions: [{ question: 'Find the Star', correct: 'Star', options: ['Star', 'Heart', 'Oval'], image: '⭐', skill: 'Recognition' }, { question: 'Which is a Heart?', correct: 'Heart', options: ['Heart', 'Diamond', 'Circle'], image: '❤️', skill: 'Recognition' }] } } },
  fruits: { name: 'Fruits', icon: '🍌', subCategories: { 'Common Fruits': { questions: [{ question: 'Which is a Banana?', correct: 'Banana', options: ['Banana', 'Apple', 'Grape'], image: '🍌', skill: 'Recognition' }, { question: 'Say "Orange"', correct: 'Orange', image: '🍊', skill: 'Speaking' }, { question: 'What is red and sweet?', correct: 'Apple', options: ['Apple', 'Lemon', 'Kiwi'], image: '🍎', skill: 'Riddle' }] }, 'Exotic': { questions: [{ question: 'Find the Pineapple', correct: 'Pineapple', options: ['Pineapple', 'Melon', 'Berry'], image: '🍍', skill: 'Recognition' }, { question: 'Say "Strawberry"', correct: 'Strawberry', image: '🍓', skill: 'Speaking' }] } } },
  veg: { name: 'Vegetables', icon: '🥕', subCategories: { 'Daily Veggies': { questions: [{ question: 'Find the Carrot', correct: 'Carrot', options: ['Carrot', 'Potato', 'Onion'], image: '🥕', skill: 'Recognition' }, { question: 'Say "Potato"', correct: 'Potato', image: '🥔', skill: 'Speaking' }, { question: 'Which is Green?', correct: 'Broccoli', options: ['Broccoli', 'Tomato', 'Corn'], image: '🥦', skill: 'Identification' }] } } },
  animals: { name: 'Animals', icon: '🦁', subCategories: { 'Farm Animals': { questions: [{ question: 'Which says Moo?', correct: 'Cow', options: ['Cow', 'Cat', 'Dog'], image: '🐄', skill: 'Sounds' }, { question: 'Find the Pig', correct: 'Pig', options: ['Pig', 'Horse', 'Duck'], image: '🐷', skill: 'Recognition' }] }, 'Wild Animals': { questions: [{ question: 'King of the Jungle?', correct: 'Lion', options: ['Lion', 'Bear', 'Wolf'], image: '🦁', skill: 'Knowledge' }, { question: 'Say "Elephant"', correct: 'Elephant', image: '🐘', skill: 'Speaking' }] } } },
  body: { name: 'Body Parts', icon: '👀', subCategories: { 'Face': { questions: [{ question: 'What do we see with?', correct: 'Eyes', options: ['Eyes', 'Ears', 'Nose'], image: '👀', skill: 'Function' }, { question: 'Touch the Nose', correct: 'Nose', options: ['Nose', 'Mouth', 'Hand'], image: '👃', skill: 'Recognition' }] }, 'Body': { questions: [{ question: 'Say "Hand"', correct: 'Hand', image: '✋', skill: 'Speaking' }, { question: 'What do we walk with?', correct: 'Legs', options: ['Legs', 'Arms', 'Head'], image: '🦵', skill: 'Function' }] } } }
};

// ============================================================================
// 5. MAIN COMPONENT
// ============================================================================

const DigitalAssessment = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  
  // --- 🔒 PRIVACY STATES ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [category, setCategory] = useState('abc');
  const [subCategory, setSubCategory] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [refreshHistory, setRefreshHistory] = useState(0); 
  
  // --- 🌟 NEW: AI GENERATION STATE ---
  const [isGenerating, setIsGenerating] = useState(false);

  const [testStarted, setTestStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const [timeStarted, setTimeStarted] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // --- FETCH STUDENTS ---
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const response = await fetch(`${API_URL}/api/students`);
        if (response.ok) {
          const data = await response.json();
          if (data.students && data.students.length > 0) setStudents(data.students);
        }
      } catch (error) { console.error("❌ Network Error:", error); } 
      finally { setIsLoadingStudents(false); }
    };
    fetchStudents();
  }, []);

  // --- TIMER ---
  useEffect(() => {
    let interval;
    if (testStarted && !testCompleted && timeStarted) {
      interval = setInterval(() => setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testCompleted, timeStarted]);

  // --- VOICE TUTOR (TTS) ---
  useEffect(() => {
    if (testStarted && questions.length > 0 && !testCompleted) speakQuestion();
    return () => window.speechSynthesis.cancel();
  }, [currentQuestionIndex, testStarted, testCompleted]);

  const speakQuestion = () => {
    if (!questions[currentQuestionIndex]) return;
    window.speechSynthesis.cancel();
    const textToRead = questions[currentQuestionIndex].question;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- PRIVACY HANDLERS ---
  const handleStudentSelection = (e) => {
      const newId = e.target.value;
      if (!newId) return;
      setPendingStudentId(newId);
      setPasswordInput('');
      setAuthError('');
      setShowPasswordModal(true);
  };

  const verifyPassword = async () => {
      if (!passwordInput) { setAuthError("Please enter the password."); return; }
      setIsVerifying(true);
      setAuthError('');
      try {
          const response = await fetch(`${API_URL}/api/verify-student-access`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: pendingStudentId, password: passwordInput })
          });
          const data = await response.json();
          if (response.ok && data.success) {
              setSelectedStudentId(pendingStudentId);
              setShowPasswordModal(false);
              setPendingStudentId(null);
          } else { setAuthError(data.message || "Incorrect Password"); }
      } catch (err) { setAuthError("Server Connection Failed"); } 
      finally { setIsVerifying(false); }
  };

  const cancelSelection = () => {
      setShowPasswordModal(false);
      setPendingStudentId(null);
      setPasswordInput('');
      setAuthError('');
      const selectElement = document.getElementById('student-select');
      if(selectElement) selectElement.value = selectedStudentId || ""; 
  };

  // =========================================================
  // 🌟 NEW: HANDLE GENERATE AI QUIZ (OPTION 3)
  // =========================================================
  const handleGenerateAiQuiz = async () => {
    if (!selectedStudentId) { alert("⚠️ Please select a student first!"); return; }
    
    setIsGenerating(true);
    try {
        // Ask Backend to generate a quiz on the currently selected category
        const response = await fetch(`${API_URL}/api/generate-ai-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                topic: category || "mixed", 
                difficulty: "Easy" 
            })
        });

        const data = await response.json();
        
        if (data.questions && data.questions.length > 0) {
            // Map AI questions to frontend structure
            const aiQuestions = data.questions.map(q => ({
                question: q.question,
                correct: q.answer,
                options: q.options,
                image: '✨', // Default sparkle for AI questions
                skill: 'AI Generated',
                category: data.topic,
                aiRecommended: true
            }));
            
            setQuestions(aiQuestions);
            setAnswers({});
            setCurrentQuestionIndex(0);
            setTestStarted(true);
            setTestCompleted(false);
            setTimeStarted(Date.now());
        } else {
            alert("AI could not generate questions. Try again!");
        }
    } catch (error) {
        console.error("AI Gen Error:", error);
        alert("Failed to connect to AI.");
    } finally {
        setIsGenerating(false);
    }
  };

  // =========================================================
  // HANDLE START TEST (OPTIONS 1 & 2)
  // =========================================================
  const handleStartTest = async () => {
    if (!selectedStudentId) { alert('⚠️ Please select a student profile!'); return; }

    let finalQuestions = [];
    setIsSubmitting(true); 

    try {
        if (isAiMode) {
            // --- OPTION 2: SMART RECOMMENDATION ---
            try {
                const response = await fetch(`${API_URL}/api/recommendation/${selectedStudentId}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Priority: Use questions from backend if available (Static or AI)
                    if (data.questions && data.questions.length > 0) {
                         finalQuestions = data.questions.map(q => ({
                            question: q.question,
                            correct: q.answer,
                            options: q.options,
                            image: '🧠',
                            skill: q.skill || 'Recommended',
                            category: data.selected_topic,
                            aiRecommended: true
                        }));
                    } 
                    // Fallback to topic matching (Old way)
                    else {
                        const recommendedTopics = data.focus_areas || []; 
                        recommendedTopics.forEach(topicKey => {
                            const key = typeof topicKey === 'object' ? topicKey.topic : topicKey;
                            const cat = QUESTION_BANK[key];
                            if (cat) {
                                const subKeys = Object.keys(cat.subCategories);
                                const randomSub = subKeys[Math.floor(Math.random() * subKeys.length)];
                                const pool = cat.subCategories[randomSub].questions;
                                const q = pool[Math.floor(Math.random() * pool.length)];
                                finalQuestions.push({ ...q, category: cat.name, aiRecommended: true });
                            }
                        });
                    }
                } else { throw new Error("API Failed"); }
            } catch (err) {
                console.error("Rec Error:", err);
                Object.keys(QUESTION_BANK).forEach(catKey => {
                    const cat = QUESTION_BANK[catKey];
                    Object.keys(cat.subCategories).forEach(subKey => {
                        const qs = cat.subCategories[subKey].questions;
                        qs.forEach(q => finalQuestions.push({ ...q, category: cat.name }));
                    });
                });
                finalQuestions.sort(() => 0.5 - Math.random());
            }
        } else {
            // --- OPTION 1: MANUAL SELECTION ---
            let targetSubCat = subCategory;
            const catData = QUESTION_BANK[category];
            if (!targetSubCat && catData) {
                targetSubCat = Object.keys(catData.subCategories)[0];
                setSubCategory(targetSubCat);
            }
            if (catData && catData.subCategories[targetSubCat]) {
                finalQuestions = catData.subCategories[targetSubCat].questions.map(q => ({...q, category: catData.name}));
            }
        }

        if (finalQuestions.length === 0) { alert('No questions found!'); return; }

        const selected = finalQuestions.slice(0, Math.min(numQuestions, finalQuestions.length));
        setQuestions(selected);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTestStarted(true);
        setTestCompleted(false);
        setSaveStatus(null);
        setTimeStarted(Date.now());
        setTimeElapsed(0);
        resetInputs();

    } finally { setIsSubmitting(false); }
  };

  const resetInputs = () => { setInputText(''); setVoiceFeedback(''); setIsListening(false); };
  const recordAnswer = (ans) => { setAnswers(prev => ({ ...prev, [currentQuestionIndex]: ans })); };
  const handleOptionClick = (option) => recordAnswer(option);
  const handleTextSubmit = (e) => { setInputText(e.target.value); recordAnswer(e.target.value); };

  // --- VOICE INPUT ---
  const recognitionRef = useRef(null);
  const handleVoiceInput = () => {
    if (isListening) return; 
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("⚠️ Voice not supported."); return; }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setVoiceFeedback("🎤 Listening..."); };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const cleanTranscript = transcript.replace(/[.,!?]/g, '').trim();
      const expected = questions[currentQuestionIndex].correct;
      const correctedTranscript = smartVoiceCorrection(cleanTranscript, expected);
      setIsListening(false);
      setVoiceFeedback(`🗣️ Heard: "${correctedTranscript}"`);
      setInputText(correctedTranscript);
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: correctedTranscript }));
    };
    recognition.onerror = () => { setIsListening(false); setVoiceFeedback("❌ Error. Try typing."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(prev => prev + 1); resetInputs(); } 
    else { submitToDatabase(); }
  };

  const submitToDatabase = async () => {
    setTestCompleted(true);
    setIsSubmitting(true);
    const { correctCount, percentage } = calculateResults();
    const payload = {
        user_id: selectedStudentId,
        category: isAiMode ? "AI Smart Quiz" : category, 
        questions: questions.map(q => ({
            questionId: q.question, 
            question: q.question,
            correct: q.correct,
            answer: answers[questions.indexOf(q)],
            isCorrect: checkAnswer(answers[questions.indexOf(q)], q.correct)
        })),
        score: correctCount,
        total_questions: questions.length,
        percentage: percentage,
        timeElapsed: timeElapsed,
        completedAt: new Date().toISOString()
    };
    try {
        const response = await fetch(`${API_URL}/api/assessments/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) { setSaveStatus('success'); setRefreshHistory(prev => prev + 1); } 
        else { setSaveStatus('error'); }
    } catch (error) { setSaveStatus('error'); } 
    finally { setIsSubmitting(false); }
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (checkAnswer(ans, q.correct)) correct++;
    });
    return { correctCount: correct, percentage: Math.round((correct / questions.length) * 100) };
  };

  const handleRestart = () => { setTestStarted(false); setTestCompleted(false); setQuestions([]); setAnswers({}); setCurrentQuestionIndex(0); resetInputs(); };
  const getStudentName = () => { const s = students.find(st => st._id === selectedStudentId); return s ? s.child_name : "Student"; };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];
  const { correctCount, percentage } = testCompleted ? calculateResults() : { correctCount: 0, percentage: 0 };
  const availableSubCategories = category ? Object.keys(QUESTION_BANK[category].subCategories) : [];

  // ============================================================================
  // VIEW 1: DASHBOARD
  // ============================================================================
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 sm:p-8 flex flex-col items-center justify-center relative">
        {showPasswordModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-200 animate-in fade-in zoom-in duration-200">
                    <div className="text-center mb-6">
                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-purple-600" /></div>
                        <h2 className="text-2xl font-bold text-gray-800">Security Check</h2>
                        <p className="text-gray-500 text-sm">Enter password for <span className="font-bold text-purple-600">{students.find(s=>s._id === pendingStudentId)?.child_name}</span></p>
                    </div>
                    <div className="relative mb-6">
                        <KeyRound className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 outline-none transition-all font-bold text-lg" placeholder="Enter Password" onKeyDown={(e) => e.key === 'Enter' && verifyPassword()} autoFocus />
                    </div>
                    {authError && <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg mb-4 flex items-center gap-2"><XCircle className="w-4 h-4" /> {authError}</div>}
                    <div className="flex gap-3">
                        <button onClick={cancelSelection} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                        <button onClick={verifyPassword} disabled={isVerifying} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex justify-center items-center">{isVerifying ? <Loader2 className="animate-spin w-5 h-5"/> : "Unlock"}</button>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-10"><h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-3">🎓 Smart Quiz</h1><p className="text-gray-600 text-lg">Curriculum-Based Learning</p></div>
          <div className="space-y-8">
            <div className="bg-white border-2 border-purple-200 p-6 rounded-2xl shadow-sm relative">
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-4"><User className="w-5 h-5 text-purple-600" /> Select Student Profile</label>
              {isLoadingStudents ? <div className="flex items-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading...</div> : students.length > 0 ? (
                  <div className="relative">
                      <select id="student-select" value={selectedStudentId || ''} onChange={handleStudentSelection} className="w-full p-4 pl-12 border-2 border-purple-300 rounded-xl text-lg bg-white appearance-none cursor-pointer hover:border-purple-500 transition-all focus:ring-4 ring-purple-100">
                        <option value="">-- Click to Select Profile --</option>
                        {students.map(std => (<option key={std._id} value={std._id}>🔒 {std.child_name}</option>))}
                      </select>
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5 pointer-events-none" />
                  </div>
              ) : <div className="text-red-500 font-bold bg-red-50 p-4 rounded-xl">❌ No students found.</div>}
              {selectedStudentId && <div className="mt-3 flex items-center text-green-600 text-sm font-bold bg-green-50 p-2 rounded-lg w-fit animate-pulse"><CheckCircle className="w-4 h-4 mr-2" /> Logged in as: {getStudentName()}</div>}
            </div>

            <div className={`transition-all duration-500 ${!selectedStudentId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl">
                  
                  {/* --- 🌟 UPDATED HEADER: NOW HAS 2 BUTTONS --- */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                      <label className="flex items-center gap-2 text-xl font-bold text-gray-800"><Trophy className="w-6 h-6 text-blue-600" /> Subject</label>
                      
                      <div className="flex gap-2">
                          {/* BUTTON 2: SMART TUTOR TOGGLE */}
                          <button onClick={() => setIsAiMode(!isAiMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border ${isAiMode ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                            <BrainCircuit className="w-4 h-4"/> {isAiMode ? "Smart Tutor ON" : "Smart Tutor OFF"}
                          </button>

                          {/* BUTTON 3: GENERATE NEW AI QUIZ (Llama 3) */}
                          <button onClick={handleGenerateAiQuiz} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:scale-105 transition-all disabled:opacity-50">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                            Generate AI Quiz
                          </button>
                      </div>
                  </div>

                  {!isAiMode ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {Object.keys(QUESTION_BANK).map(cat => (
                          <button key={cat} onClick={() => { setCategory(cat); setSubCategory(''); }} className={`p-3 rounded-xl font-bold capitalize transition-all flex flex-col items-center justify-center gap-1 ${category === cat ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-gray-700 shadow-md hover:bg-gray-50'}`}><span className="text-2xl">{QUESTION_BANK[cat].icon}</span><span className="text-xs text-center">{QUESTION_BANK[cat].name}</span></button>
                        ))}
                      </div>
                  ) : <div className="p-6 bg-purple-100 rounded-xl text-purple-800 font-bold text-center border-2 border-purple-200">🤖 AI Mode Active!<br/><span className="text-sm font-normal text-purple-600">The system is scanning your progress history to find your weak spots.</span></div>}
                </div>

                {!isAiMode && category && availableSubCategories.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 mt-4">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-4"><Target className="w-5 h-5 text-green-600" /> Select Level</label>
                    <div className="flex flex-wrap gap-3">{availableSubCategories.map(subCat => (<button key={subCat} onClick={() => setSubCategory(subCat)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${subCategory === subCat ? 'bg-green-500 text-white shadow-md' : 'bg-white border hover:bg-gray-100'}`}>{subCat}</button>))}</div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-end mt-4">
                    <div className="bg-orange-50 p-4 rounded-xl flex-1 w-full"><label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2"><Star className="w-4 h-4 text-orange-500" /> Question Count: {numQuestions}</label><input type="range" min="3" max="15" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))} className="w-full h-2 bg-orange-200 rounded-lg accent-orange-500"/></div>
                    <button onClick={handleStartTest} disabled={!selectedStudentId || isSubmitting} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-extrabold text-xl rounded-xl shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin"/> : <><ArrowRight className="w-6 h-6" /> Start</>}</button>
                </div>
            </div>
          </div>
        </div>
        {selectedStudentId && <div className="w-full max-w-5xl"><QuizHistory studentId={selectedStudentId} refreshTrigger={refreshHistory} /></div>}
      </div>
    );
  }

  // VIEW 2: QUIZ
  if (!testCompleted) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-full"><User className="w-6 h-6 text-purple-600"/></div><div><h2 className="text-xl font-bold text-gray-800">{getStudentName()}</h2><p className="text-xs text-gray-500 font-bold capitalize">{isAiMode ? <span className="flex items-center gap-1 text-purple-600"><BrainCircuit className="w-3 h-3"/> AI Quiz</span> : `${category} • ${subCategory}`}</p></div></div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-bold"><Clock className="w-5 h-5 inline mr-1" /> {formatTime(timeElapsed)}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6"><div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border-4 border-purple-100 text-center">
            <div className="mb-4 flex justify-between items-center px-2">
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wide">{currentQuestion.skill || "General"} Skill</span>
                {currentQuestion.aiRecommended && <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3"/> Recommended</span>}
            </div>
            <div className="text-9xl mb-8 animate-bounce select-none">{currentQuestion.image}</div>
            <div className="flex items-center justify-center gap-3 mb-8"><h2 className="text-3xl sm:text-4xl font-black text-gray-800">{currentQuestion.question}</h2><button onClick={speakQuestion} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors" title="Read Again"><Volume2 className="w-6 h-6" /></button></div>
            <div className="space-y-8">
                {currentQuestion.options && <div className="grid grid-cols-2 gap-4">{currentQuestion.options.map((opt, idx) => (<button key={idx} onClick={() => handleOptionClick(opt)} className={`p-6 rounded-2xl font-bold text-2xl transition-all border-b-4 ${selectedAnswer === opt ? 'bg-purple-600 text-white border-purple-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50'}`}>{opt}</button>))}</div>}
                <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-purple-200">
                    <button onClick={handleVoiceInput} className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50'}`}><Mic className={`w-8 h-8 ${isListening ? 'animate-bounce' : ''}`} /> {isListening ? 'Listening...' : 'Speak Answer'}</button>
                    {voiceFeedback && <p className={`text-lg font-bold px-4 py-2 rounded-lg ${voiceFeedback.includes('Heard') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{voiceFeedback}</p>}
                    <div className="relative w-full max-w-sm mt-4"><Keyboard className="absolute left-4 top-4 text-gray-400 w-6 h-6" /><input type="text" value={inputText} onChange={handleTextSubmit} placeholder="Type answer here..." className="w-full pl-12 p-4 text-center font-bold text-xl rounded-xl border-2 border-purple-300 focus:border-purple-600 outline-none shadow-sm"/></div>
                </div>
            </div>
            <div className="mt-10 flex justify-end"><button onClick={handleNext} disabled={!selectedAnswer} className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-2xl rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-40">{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} <ArrowRight className="w-8 h-8" /></button></div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: RESULTS
  return (
    <div className="min-h-screen bg-purple-50 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-b-8 border-yellow-400 mb-8">
        <Award className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h1 className="text-5xl font-black text-gray-800 mb-2">Quiz Complete!</h1>
        <p className="text-xl text-gray-500 mb-8">Great job, <span className="text-purple-600 font-bold">{getStudentName()}</span>!</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-100 p-4 rounded-xl"><p className="text-green-700 font-bold text-xs uppercase">Correct</p><p className="text-4xl font-black text-green-800">{correctCount}/{questions.length}</p></div>
            <div className="bg-blue-100 p-4 rounded-xl"><p className="text-blue-700 font-bold text-xs uppercase">Score</p><p className="text-4xl font-black text-blue-800">{percentage}%</p></div>
            <div className="bg-purple-100 p-4 rounded-xl"><p className="text-purple-700 font-bold text-xs uppercase">Time</p><p className="text-4xl font-black text-purple-800">{formatTime(timeElapsed)}</p></div>
        </div>
        <div className="mb-8">
            {isSubmitting && <div className="text-blue-600 font-bold flex justify-center items-center gap-2"><Loader2 className="animate-spin"/> Saving results...</div>}
            {!isSubmitting && saveStatus === 'success' && <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold flex justify-center items-center gap-2"><CheckCircle /> Saved Successfully!</div>}
            {!isSubmitting && saveStatus === 'error' && <div className="bg-red-100 text-red-800 p-4 rounded-xl font-bold flex justify-center items-center gap-2"><XCircle /> Save Failed.</div>}
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={handleRestart} className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2 text-lg"><RotateCcw className="w-6 h-6"/> Play Again</button>
          <button onClick={() => window.location.reload()} className="px-8 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 text-lg">Exit</button>
        </div>
      </div>
      <div className="w-full max-w-3xl"><QuizHistory studentId={selectedStudentId} refreshTrigger={refreshHistory} /></div>
    </div>
  );
};

export default DigitalAssessment;