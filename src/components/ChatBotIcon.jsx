// components/ChatBotIcon.jsx - WITH "AGENT" TEXT BOX
import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Heart } from 'lucide-react';

const ChatBotIcon = ({ onOpen }) => {
  const [isBouncing, setIsBouncing] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  
  // Color themes that change on click
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

  // Periodic pulsing for attention
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

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-6 right-6 z-50
        transition-all duration-500
        ${isBouncing ? 'animate-bounce' : ''}
        ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
      `}
      aria-label="Open Learning Agent"
    >
      {/* Main Icon Container */}
      <div className={`
        relative w-16 h-16 rounded-full
        bg-gradient-to-br ${currentTheme.gradient}
        shadow-2xl shadow-current
        flex items-center justify-center
        transition-all duration-300
        group
        ${isPulsing ? 'animate-pulse ring-4 ring-opacity-50' : ''}
        ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
      `}>
        
        {/* Chat Icon */}
        <MessageCircle className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
        
        {/* Heart animation on click */}
        {showHeart && (
          <Heart className="absolute -top-2 -right-2 w-5 h-5 text-pink-500 fill-pink-500 animate-ping" />
        )}

        {/* Sparkle effect on hover */}
        {isHovered && (
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-ping" />
        )}

        {/* Animated Ping Ring */}
        <div className={`absolute inset-0 border-4 ${currentTheme.ping} rounded-full animate-ping opacity-75`}></div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-float"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-300 rounded-full opacity-70 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-2 -right-2 w-2 h-2 bg-pink-300 rounded-full opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* --- NEW: AGENT TEXT BOX (Appears on hover) --- */}
      <div className="absolute right-20 bottom-2 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg border border-blue-400">
        <div className="font-bold flex items-center gap-2">
          <span> AGENT</span>
        </div>
        <div className="text-xs text-blue-100 mt-1">Your Learning Assistant</div>
        
        {/* Speech bubble pointer */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-blue-600 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
      </div>

      {/* Original Tooltip with changing name */}
      <div className="absolute right-20 -top-4 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border max-w-xs">
        <div className="font-bold">Hi! I'm {currentTheme.name}! 🤖</div>
        <div className="text-gray-600">I love helping kids learn!</div>
        <div className="triangle absolute -right-2 top-3 w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
      </div>
    </button>
  );
};

export default ChatBotIcon;