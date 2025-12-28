import React from 'react';
import { Link } from 'react-router-dom';
import Masha from '../assets/new1.jpg'; // import your Masha image

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-blue-400 to-purple-500 py-20 px-4 text-white overflow-hidden">
      
      {/* --- CSS Animations --- */}
      <style>{`
        /* 1. Fun Bounce Entrance */
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        /* 2. Gentle Floating */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }

        /* 3. Text Slide In */
        @keyframes slideInFromRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        /* --- CLASSES --- */
        .animate-pop-float {
          /* Bounce first (1s), then Float forever */
          animation: bounceIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, 
                     float 3s ease-in-out infinite 1s; 
        }

        .animate-slide-in-right {
          animation: 1s ease-out 0.2s 1 slideInFromRight forwards;
          opacity: 0;
        }
      `}</style>

      {/* --- Layout --- */}
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* Column 1: Image */}
        {/* REMOVED: border-4 border-white */}
        {/* Kept: shadow-2xl for depth, rounded-full for circle shape */}
        <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto md:mx-0 flex-shrink-0 rounded-full flex items-center justify-center shadow-2xl overflow-hidden animate-pop-float">
          <img 
            src={Masha} 
            alt="Masha Mascot" 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Column 2: Text Content */}
        <div 
          className="flex flex-col items-center md:items-start text-center md:text-left animate-slide-in-right"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 drop-shadow-md">
            Learn, Play, and Grow with Our Smart Tutor!
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl opacity-90 font-medium">
            An engaging web-based system designed for early childhood education, making learning fun with interactive animated characters and exciting activities.
          </p>
          <Link 
            to="/login" 
            className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-300 hover:scale-105 transition duration-300 transform"
          >
            Get Started
          </Link>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;