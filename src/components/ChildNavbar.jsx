import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Import icons
import { 
  Home, Mic, Palette, Shapes, Binary, Apple, Pencil, Bot, 
  Menu, X, BrainCircuit, UserCircle, LogOut, ChevronDown, BookOpen,
  Contact, BarChart3 // <-- NEW: Added BarChart3 for Teacher Dashboard
} from 'lucide-react';

const ChildNavbar = ({ onContentSelect, activeContent }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLessonsDropdownOpen, setIsLessonsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // --- Get user name from localStorage ---
  useEffect(() => {
    const firstName = localStorage.getItem('first_name') || 'Child';
    setUserName(firstName);
  }, []);

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    navigate('/');
  };

  // --- Effect to close dropdown on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLessonsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // --- Organized Nav Items ---
  const lessonNavItems = [
    { id: 'abc', label: 'ABC', icon: Binary },
    { id: 'numbers', label: 'Numbers', icon: Binary },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'fruits', label: 'Fruits', icon: Apple },
    { id: 'poems', label: 'Poems', icon: Mic },
    { id: 'drawing', label: 'Drawing', icon: Pencil },
  ];
  
  // Link for the proxied (dynamic AI) 3D app
  const aiTutorLink = { id: 'aiTeacherLink', label: '3D AI Teacher', icon: Bot, path: '/ai-teacher', isExternalProxy: true };
  
  // NEW: Teacher Dashboard Link
  const teacherDashboardLink = { id: 'teacherDashboard', label: 'My Progress', icon: BarChart3, path: '/teacher-dashboard', isExternalLink: true };

  // Handlers to close menus on selection
  const handleSelect = (contentId) => {
    if (onContentSelect) {
      onContentSelect(contentId);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLessonSelect = (contentId, isLink = false, path = '/') => {
    if (isLink) {
      navigate(path);
    } else {
      if (onContentSelect) {
        onContentSelect(contentId);
      }
    }
    setIsLessonsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-opacity-95 backdrop-blur-sm shadow-md p-2 z-50 h-16 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-2 sm:px-4">
        
        {/* Logo/Brand */}
        <div
          onClick={() => handleSelect('home')}
          className="text-white font-bold text-xl sm:text-2xl cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
          aria-label="Go to Home"
        >
            <BrainCircuit size={24}/>
            Smart Tutor
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-wrap items-center justify-center space-x-1 lg:space-x-2">
          {/* Home Button */}
          <button
            onClick={() => handleSelect('home')}
            className={`flex items-center font-semibold text-xs lg:text-sm py-1.5 px-2 lg:px-3 my-1 rounded-full transition-all duration-300 transform hover:scale-105 shadow-sm ${
              activeContent === 'home'
                ? 'bg-yellow-300 text-purple-700 scale-105 ring-2 ring-yellow-400'
                : 'text-white bg-white/10 hover:bg-white/20'
            }`}
          >
            <Home className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
            Home
          </button>

          {/* Lessons Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLessonsDropdownOpen(prev => !prev)}
              className={`flex items-center font-semibold text-xs lg:text-sm py-1.5 px-2 lg:px-3 my-1 rounded-full transition-all duration-300 transform hover:scale-105 shadow-sm text-white bg-white/10 hover:bg-white/20 ${
                isLessonsDropdownOpen ? 'bg-white/20' : ''
              }`}
            >
              <BookOpen className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
              Lessons
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isLessonsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLessonsDropdownOpen && (
              <div className="absolute top-full mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in-fast">
                {lessonNavItems.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson.id, lesson.isLink, lesson.path)}
                    className={`flex items-center w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                      activeContent === lesson.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${lesson.isLink ? 'font-bold text-blue-600' : ''}`}
                  >
                    {lesson.icon && <lesson.icon className="w-4 h-4 mr-2" />}
                    {lesson.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D AI Chat Link */}
          <a
            href={aiTutorLink.path}
            className={`flex items-center font-semibold text-xs lg:text-sm py-1.5 px-2 lg:px-3 my-1 rounded-full transition-all duration-300 transform hover:scale-105 shadow-sm text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600`}
            aria-label={aiTutorLink.label}
          >
            {aiTutorLink.icon && <aiTutorLink.icon className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />}
            {aiTutorLink.label}
          </a>

          {/* NEW: Teacher Dashboard Link */}
          <Link
            to={teacherDashboardLink.path}
            className={`flex items-center font-semibold text-xs lg:text-sm py-1.5 px-2 lg:px-3 my-1 rounded-full transition-all duration-300 transform hover:scale-105 shadow-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600`}
            aria-label={teacherDashboardLink.label}
          >
            {teacherDashboardLink.icon && <teacherDashboardLink.icon className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />}
            {teacherDashboardLink.label}
          </Link>

        </div>

        {/* --- Right Side: User Profile & Mobile Menu Button --- */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-white font-semibold">
              <UserCircle className="w-6 h-6" />
              <span>{userName}</span>
          </div>
          <button 
            onClick={handleLogout} 
            title="Logout"
            className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition-colors hidden sm:block"
          >
            <LogOut className="w-5 h-5" />
          </button>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-white hover:bg-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}
              >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-blue-500 to-purple-600 shadow-lg rounded-b-lg p-3 space-y-1">
              {/* Mobile: Home Button */}
              <button onClick={() => handleSelect('home')} className={`flex items-center w-full text-left font-semibold py-2 px-3 rounded-md transition-colors duration-200 ${ activeContent === 'home' ? 'bg-yellow-300 text-purple-700' : 'text-white hover:bg-white/20' }`} >
                  <Home className="w-5 h-5 mr-2" /> Home
              </button>
              
              {/* Mobile: Lesson Links */}
              <div className="border-t border-b border-white/20 py-1 my-1">
                {lessonNavItems.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => handleLessonSelect(item.id, item.isLink, item.path)} 
                      className={`flex items-center w-full text-left font-semibold py-2 px-3 rounded-md transition-colors duration-200 ${ activeContent === item.id ? 'bg-yellow-300 text-purple-700' : 'text-white hover:bg-white/20' } ${item.isLink ? 'font-bold text-blue-200' : ''}`}
                    >
                        {item.icon && <item.icon className="w-5 h-5 mr-2" />} {item.label}
                    </button> 
                ))}
              </div>
              
              {/* Mobile: 3D Tutor Link */}
              <a href={aiTutorLink.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center w-full text-left font-semibold py-2 px-3 rounded-md transition-colors duration-200 text-white bg-green-500 hover:bg-green-600`}>
                  {aiTutorLink.icon && <aiTutorLink.icon className="w-5 h-5 mr-2" />} {aiTutorLink.label}
              </a>

              {/* NEW: Mobile: Teacher Dashboard Link */}
              <Link to={teacherDashboardLink.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center w-full text-left font-semibold py-2 px-3 rounded-md transition-colors duration-200 text-white bg-orange-500 hover:bg-orange-600`}>
                  {teacherDashboardLink.icon && <teacherDashboardLink.icon className="w-5 h-5 mr-2" />} {teacherDashboardLink.label}
              </Link>
              
              {/* Mobile: Logout */}
              <button onClick={handleLogout} className={`flex items-center w-full text-left font-semibold py-2 px-3 rounded-md transition-colors duration-200 text-white bg-red-500 hover:bg-red-600 mt-2`} >
                  <LogOut className="w-5 h-5 mr-2" /> Logout (User: {userName})
              </button>
          </div>
      )}

      {/* Simple CSS for animation */}
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
            animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default ChildNavbar;