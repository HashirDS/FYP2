import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TeachingCharacter3D from './TeachingCharacter3D';

const TeachingInterface = () => {
  // State management
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isTeaching, setIsTeaching] = useState(false);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [childInput, setChildInput] = useState('');
  const [availableLessons, setAvailableLessons] = useState({ ABC: [], Numbers: [] });
  const [selectedTopic, setSelectedTopic] = useState('ABC');
  const [isLoading, setIsLoading] = useState(false);
  const [characterReady, setCharacterReady] = useState(false);
  const [availableAnimations, setAvailableAnimations] = useState([]);
  
  // Audio references
  const audioRef = useRef(null);
  const characterRef = useRef(null);

  // Backend API base URL
  const API_BASE = 'http://localhost:5000';

  // Load available lessons on component mount
  useEffect(() => {
    loadAvailableLessons();
  }, []);

  // Load lessons from backend
  const loadAvailableLessons = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/get-lesson-list`);
      const lessons = await response.json();
      setAvailableLessons(lessons);
      console.log('Available lessons:', lessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  // Start a new lesson
  const startLesson = async (topic, item) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/start-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, item })
      });

      if (!response.ok) {
        throw new Error('Failed to start lesson');
      }

      const lesson = await response.json();
      setCurrentLesson(lesson);
      setIsTeaching(true);
      
      console.log('Lesson started:', lesson);

      // Speak the lesson text
      speakText(lesson.teaching_text);

    } catch (error) {
      console.error('Error starting lesson:', error);
      setTeacherResponse('Sorry, I had trouble starting the lesson. Let me try again!');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle child's response
  const handleChildResponse = async () => {
    if (!childInput.trim()) return;

    setIsLoading(true);
    try {
      const context = currentLesson ? 
        `${currentLesson.topic} - ${currentLesson.item}` : 
        'general';

      const response = await fetch(`${API_BASE}/api/child-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response: childInput,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process response');
      }

      const feedback = await response.json();
      setTeacherResponse(feedback.teacher_response);
      
      // Celebrate the child's response
      if (characterRef.current?.teachingMethods) {
        characterRef.current.teachingMethods.celebrateResponse();
      }

      // Speak the teacher's response
      speakText(feedback.teacher_response);

      // Clear input
      setChildInput('');

    } catch (error) {
      console.error('Error processing child response:', error);
      setTeacherResponse('Great job! Keep learning!');
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech function (using browser TTS for simplicity)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;
      utterance.pitch = 1.3;
      utterance.volume = 0.9;

      // Try to find a child-friendly voice
      const voices = window.speechSynthesis.getVoices();
      const childVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('samantha')
      );
      
      if (childVoice) {
        utterance.voice = childVoice;
      }

      utterance.onend = () => {
        console.log('Speech ended');
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Character ready callback
  const handleCharacterReady = (animations) => {
    setCharacterReady(true);
    setAvailableAnimations(animations);
    console.log('Character ready with animations:', animations);
  };

  // Stop current lesson
  const stopLesson = () => {
    setIsTeaching(false);
    setCurrentLesson(null);
    setTeacherResponse('');
    window.speechSynthesis.cancel();
    
    if (characterRef.current?.teachingMethods) {
      characterRef.current.teachingMethods.returnToIdle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">
          Smart 3D Teacher
        </h1>
        <p className="text-purple-600">
          {characterReady ? 'Your teacher is ready!' : 'Loading your teacher...'}
        </p>
      </div>

      {/* Main Teaching Area */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3D Character Display */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
          <div className="h-96 w-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
            <Canvas
              camera={{ position: [0, 1.5, 4], fov: 50 }}
              shadows
            >
              <ambientLight intensity={0.6} />
              <spotLight 
                position={[10, 10, 10]} 
                angle={0.3} 
                penumbra={1} 
                intensity={1}
                castShadow
              />
              <pointLight position={[-10, -10, -10]} intensity={0.3} />
              
              <TeachingCharacter3D
                ref={characterRef}
                modelPath="/models/rain.glb"
                scale={0.015}
                position={[0, -1.2, 0]}
                rotation={[0, Math.PI, 0]}
                currentLesson={currentLesson}
                isTeaching={isTeaching}
                onCharacterReady={handleCharacterReady}
              />
              
              {/* Enable for debugging - remove in production */}
              {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
            </Canvas>
          </div>
          
          {/* Character Status */}
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              characterReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                characterReady ? 'bg-green-400' : 'bg-yellow-400'
              } ${characterReady ? 'animate-pulse' : ''}`}></div>
              {characterReady ? 'Teacher Ready' : 'Loading...'}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          
          {/* Lesson Selection */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Choose a Lesson</h3>
            
            {/* Topic Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedTopic('ABC')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTopic === 'ABC' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ABC Letters
              </button>
              <button
                onClick={() => setSelectedTopic('NUMBERS')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTopic === 'NUMBERS' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Numbers
              </button>
            </div>

            {/* Lesson Items */}
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {availableLessons[selectedTopic]?.map((item) => (
                <button
                  key={item}
                  onClick={() => startLesson(selectedTopic, item)}
                  disabled={isLoading || !characterReady}
                  className="p-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Current Lesson Info */}
          {currentLesson && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Current Lesson</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>Topic:</strong> {currentLesson.topic}</p>
                <p><strong>Learning:</strong> {currentLesson.item}</p>
                {currentLesson.lesson_content?.word && (
                  <p><strong>Word:</strong> {currentLesson.lesson_content.word}</p>
                )}
                <p className="text-purple-600 font-medium">
                  {currentLesson.teaching_text}
                </p>
                {currentLesson.activity && (
                  <p className="text-blue-600 italic">
                    Activity: {currentLesson.activity}
                  </p>
                )}
              </div>
              
              <button
                onClick={stopLesson}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Lesson
              </button>
            </div>
          )}

          {/* Child Interaction */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Talk to Your Teacher</h3>
            
            <div className="space-y-4">
              <textarea
                value={childInput}
                onChange={(e) => setChildInput(e.target.value)}
                placeholder="Type your answer or question here..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
              
              <button
                onClick={handleChildResponse}
                disabled={isLoading || !childInput.trim() || !characterReady}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-lg hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Thinking...' : 'Send to Teacher'}
              </button>
            </div>

            {/* Teacher Response */}
            {teacherResponse && (
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-gray-800 font-medium">Teacher says:</p>
                <p className="text-purple-700 mt-1">{teacherResponse}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => speakText("Hello! I'm your teacher. Ready to learn?")}
                disabled={!characterReady}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Say Hello
              </button>
              
              <button
                onClick={() => {
                  if (characterRef.current?.teachingMethods) {
                    characterRef.current.teachingMethods.celebrateResponse();
                  }
                  speakText("Great job! You're doing amazing!");
                }}
                disabled={!characterReady}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Celebrate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeachingInterface;