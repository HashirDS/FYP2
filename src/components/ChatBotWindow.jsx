// components/ChatBotWindow.jsx - WITH TYPING INDICATOR
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, BookOpen, Palette, Mic, MicOff } from 'lucide-react';

const ChatBotWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your Learning Buddy! 🎉 Welcome to our Smart Learning System! I can talk and listen! Click the microphone to speak to me! 🎤", 
      type: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // 🆕 TYPING INDICATOR STATE
  const messagesEndRef = useRef(null);
  
  // Speech recognition setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setIsProcessing(true);
        
        // Show listening message
        setMessages(prev => [...prev, 
          { id: Date.now(), text: transcript, type: 'user' }
        ]);
        
        // Show typing indicator
        setIsTyping(true);
        
        // Automatically send the voice message
        setTimeout(() => {
          handleSendMessage(transcript);
          setIsProcessing(false);
        }, 1000);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        setIsTyping(false);
        setMessages(prev => [...prev, 
          { id: Date.now() + 1, text: "😅 Oops! I couldn't hear you properly. Please try again!", type: 'bot' }
        ]);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); // 🆕 Also scroll when typing appears

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMessages(prev => [...prev, 
        { id: Date.now() + 1, text: "🎤 Voice feature not supported in this browser. Try Chrome or Edge!", type: 'bot' }
      ]);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setMessages(prev => [...prev, 
        { id: Date.now() + 1, text: "🎤 I'm listening... Speak now!", type: 'bot' }
      ]);
    }
  };

  // Enhanced welcome responses with voice prompts
  const getWelcomeResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return {
        text: `🌟 Welcome to Smart Learning System! 🌟

I'm so excited to have you here! You can TYPE or SPEAK to me! 🎤

🎮 **3D AI Teacher** - Learn with interactive 3D models
🗣️ **Voice System** - Talk and get voice responses 
📚 **Smart Lessons** - ABCs, Numbers, Shapes, Colors

Click the microphone icon to talk to me! What would you like to explore?`,
        quickReplies: ['3D models', 'Voice system', 'ABC lessons', 'Talk to me']
      };
    }

    if (lowerMessage.includes('talk') || lowerMessage.includes('speak') || lowerMessage.includes('voice')) {
      return {
        text: `🎤 **Voice Feature Activated!**

You can talk to me! Just click the microphone button and speak! 

I can help you with:
• Asking questions about lessons
• Learning ABCs and numbers  
• Exploring system features
• Getting help with anything!

Try saying: "Tell me about ABCs" or "What is 3D teacher?"`,
        quickReplies: ['Start talking', 'ABC lessons', '3D models', 'Numbers']
      };
    }

    if (lowerMessage.includes('3d') || lowerMessage.includes('model') || lowerMessage.includes('three')) {
      return {
        text: `🎮 **3D AI Teacher Feature!**

Experience learning like never before! Our 3D teacher talks and moves! 

✨ **Voice Commands you can try:**
• "Open 3D teacher"
• "Show me the 3D character"  
• "Start 3D lessons"

Click on "AI Teacher" in the menu to see the magic! 🚀`,
        quickReplies: ['Open 3D teacher', 'Voice system', 'Start talking']
      };
    }

    if (lowerMessage.includes('learn') || lowerMessage.includes('start') || lowerMessage.includes('begin')) {
      return {
        text: `📚 **Let's Start Learning - You Can Speak Too!**

Choose what you want to learn - type OR use your voice! 🎤

🔤 **ABC Lessons** - Letters and alphabet fun
🔢 **Number Lessons** - Counting and math basics  
🟦 **Shape Lessons** - Discover different shapes

Try saying: "I want to learn ABCs" or "Start numbers lesson"`,
        quickReplies: ['ABCs', 'Numbers', 'Shapes', 'Use voice']
      };
    }

    return null;
  };

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), text: messageText, type: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true); // 🆕 SHOW TYPING INDICATOR

    // First check for welcome/feature messages
    const welcomeResponse = getWelcomeResponse(messageText);
    if (welcomeResponse) {
      setTimeout(() => {
        setIsTyping(false); // 🆕 HIDE TYPING INDICATOR
        setMessages(prev => [...prev, 
          { id: Date.now() + 1, text: welcomeResponse.text, type: 'bot' }
        ]);
        
        // Add quick reply buttons if available
        if (welcomeResponse.quickReplies) {
          setTimeout(() => {
            setMessages(prev => [...prev,
              {
                id: Date.now() + 2,
                text: `Quick options: ${welcomeResponse.quickReplies.join(', ')}`,
                type: 'quick-reply',
                options: welcomeResponse.quickReplies
              }
            ]);
          }, 500);
        }
      }, 1500); // 🆕 Simulate thinking time
      return;
    }

    // If not a welcome message, send to backend
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          context: {
            current_page: window.location.pathname,
            system_features: true,
            voice_input: true
          }
        })
      });

      const data = await response.json();
      
      setIsTyping(false); // 🆕 HIDE TYPING INDICATOR
      setMessages(prev => [...prev, 
        { id: Date.now() + 1, text: data.reply, type: 'bot' }
      ]);
    } catch (error) {
      setIsTyping(false); // 🆕 HIDE TYPING INDICATOR
      setMessages(prev => [...prev, 
        { id: Date.now() + 1, text: "I'm here to help you learn! Try asking about 3D models, voice features, or learning lessons! 🚀", type: 'bot' }
      ]);
    }
  };

  const handleQuickReply = (reply) => {
    setInput(reply);
    setTimeout(() => {
      handleSendMessage(reply);
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Learning Buddy</h3>
            <p className="text-xs opacity-80">Talk or Type! 🎤</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} ${message.type === 'quick-reply' ? 'justify-center' : ''}`}>
            
            {message.type === 'quick-reply' ? (
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2">{message.text}</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(option)}
                      className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full hover:bg-blue-200 transition-colors border border-blue-300"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`flex items-start space-x-2 max-w-xs ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {message.type === 'user' ? 
                    <User className="w-3 h-3 text-white" /> : 
                    <Bot className="w-3 h-3 text-white" />
                  }
                </div>
                <div className={`px-3 py-2 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {message.text.split('\n').map((line, i) => (
                    <div key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* 🆕 TYPING INDICATOR */}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="flex items-start space-x-2 max-w-xs">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Voice Button */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {/* Voice Button */}
          <button
            onClick={toggleListening}
            disabled={isProcessing || isTyping} // 🆕 Disable during typing
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : isProcessing
                ? 'bg-yellow-500 text-white'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type or click mic to speak..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isProcessing || isTyping} // 🆕 Disable during typing
          />
          
          {/* Send Button */}
          <button 
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isProcessing || isTyping} // 🆕 Disable during typing
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Voice Status */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {isListening ? "🎤 Listening... Speak now!" : 
             isProcessing ? "🔄 Processing..." :
             isTyping ? "🤖 Thinking..." : // 🆕 Typing status
             "Try: 'Tell me about ABCs' or 'What is 3D teacher?'"}
          </p>
          
          {/* Browser Support Indicator */}
          <div className={`text-xs px-2 py-1 rounded ${
            recognitionRef.current 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {recognitionRef.current ? '🎤 Voice Ready' : '⚠️ Use Chrome for Voice'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotWindow;