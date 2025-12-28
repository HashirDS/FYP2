import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

// Your existing components
import Homepage from './components/Homepage.jsx';
import LoginSignup from './components/LoginSignup.jsx';
import ChildDashboard from './components/ChildDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import GeneralCharacter from './components/GeneralCharacter.jsx';
import TeachingInterface from './components/TeachingInterface.jsx';
import { Experience } from './components/Experience.jsx';
import WelcomeMessage from './components/WelcomeMessage.jsx';
import VoiceEnabledWrapper from './components/voice/VoiceEnabledWrapper.jsx';
import PoemsLesson from './components/PoemsLesson.jsx';
import DrawingBoard from './components/DrawingBoard.jsx';
import AbcLesson from './components/AbcLesson.jsx';
import ShapesLesson from './components/ShapesLesson.jsx';
import NumLesson from './components/NumLesson.jsx';
import ColorsLesson from './components/ColorsLesson.jsx';

// Chatbot components
import ChatBotIcon from './components/ChatBotIcon.jsx';
import ChatBotWindow from './components/ChatBotWindow.jsx';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {showWelcome && <WelcomeMessage />}
      
      {/* --- CHATBOT APPEARS ON ALL PAGES --- */}
      <ChatBotIcon onOpen={() => setIsChatOpen(true)} />
      {isChatOpen && <ChatBotWindow onClose={() => setIsChatOpen(false)} />}

      <Routes>
        {/* Homepage & Auth */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginSignup />} />

        {/* Dashboards */}
        <Route
          path="/child-dashboard"
          element={
            <VoiceEnabledWrapper>
              <ChildDashboard />
            </VoiceEnabledWrapper>
          }
        />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />

        {/* Characters & Teaching */}
        <Route
          path="/general-character"
          element={
            <VoiceEnabledWrapper>
              <GeneralCharacter />
            </VoiceEnabledWrapper>
          }
        />
        <Route
          path="/teaching"
          element={
            <VoiceEnabledWrapper>
              <TeachingInterface />
            </VoiceEnabledWrapper>
          }
        />

        {/* AI Teacher */}
        <Route path="/ai-teacher" element={<Experience />} />

        {/* Learning Pages */}
        <Route path="/drawing-board" element={<DrawingBoard />} />
        <Route path="/poems-lesson" element={<PoemsLesson />} />
        <Route path="/abc-lesson" element={<AbcLesson />} />
        <Route path="/shapes-lesson" element={<ShapesLesson />} />
        <Route path="/num-lesson" element={<NumLesson />} />
        <Route path="/colors-lesson" element={<ColorsLesson />} />
      </Routes>
    </Router>
  );
}

export default App;