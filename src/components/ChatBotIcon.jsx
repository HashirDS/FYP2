// components/ChatBotIcon.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Heart, X, ChevronLeft } from 'lucide-react';

const ChatBotIcon = ({ onOpen }) => {
  const [isMinimized, setIsMinimized] = useState(false); // New state for hiding
  const [isBouncing, setIsBouncing] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  
  const colorThemes = [
    { gradient: 'from-blue-500 to-purple-600', ping: 'border-blue-300', name: 'Blue Buddy' },
    { gradient: 'from-green-500 to-teal-600', ping: 'border-green-300', name: 'Green Genius' },
    { gradient: 'from-pink-500 to-red-500', ping: 'border-pink-300', name: 'Pink Pal' },
    { gradient: 'from-yellow-500 to-orange-500', ping: 'border-yellow-300', name: 'Sunny Friend' },
    { gradient: 'from-purple-500 to-indigo-600', ping: 'border-purple-300', name: 'Purple Partner' },
  ];

  const currentTheme = colorThemes[clickCount % colorThemes.length];

  useEffect(() => {
    const bounceTimer = setTimeout(() => setIsBouncing(false), 2000);
    return () => clearTimeout(bounceTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
    onOpen();
  };

  // --- RENDER MINIMIZED STATE (Small Tab) ---
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-0 z-50 bg-blue-600 text-white p-2 rounded-l-xl shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-1 animate-slide-in"
        aria-label="Show Chat Assistant"
      >
        <ChevronLeft className="w-4 h-4" />
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  // --- RENDER FULL STATE (Big Icon) ---
  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">
      
      {/* MINIMIZE BUTTON (The tiny 'X') */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsMinimized(true);
        }}
        className="bg-gray-200 text-gray-600 rounded-full p-1 hover:bg-red-500 hover:text-white transition-colors shadow-sm mb-1"
        aria-label="Hide Chat Assistant"
      >
        <X className="w-4 h-4" />
      </button>

      {/* MAIN BIG BUTTON */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative
          transition-all duration-500
          ${isBouncing ? 'animate-bounce' : ''}
          ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
        `}
        aria-label="Open Learning Agent"
      >
        {/* Main Icon Circle */}
        <div className={`
          relative w-12 h-12 md:w-16 md:h-16 rounded-full
          bg-gradient-to-br ${currentTheme.gradient}
          shadow-2xl shadow-current
          flex items-center justify-center
          transition-all duration-300
          group
          ${isPulsing ? 'animate-pulse ring-4 ring-opacity-50' : ''}
          ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
        `}>
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white transition-transform duration-300 group-hover:scale-110" />
          
          {showHeart && (
            <Heart className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 text-pink-500 fill-pink-500 animate-ping" />
          )}

          {isHovered && (
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 text-yellow-300 animate-ping" />
          )}

          <div className={`absolute inset-0 border-4 ${currentTheme.ping} rounded-full animate-ping opacity-75`}></div>
        </div>

        {/* --- AGENT TEXT (Desktop Only) --- */}
        <div className="hidden md:block absolute right-20 bottom-2 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg border border-blue-400">
          <div className="font-bold flex items-center gap-2">
            <span> AGENT</span>
          </div>
          <div className="text-xs text-blue-100 mt-1">Your Learning Assistant</div>
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-blue-600 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </button>
    </div>
  );
};

export default ChatBotIcon;