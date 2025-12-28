import React from 'react';

const TutorSelection = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 to-indigo-500 p-8">
      <h1 className="text-5xl font-extrabold text-white mb-12 text-center drop-shadow-lg">
        Choose Your Friendly Tutor!
      </h1>
      <div className="flex flex-col sm:flex-row gap-8">
        {/* General Tutor Option */}
        <div 
          onClick={() => onSelect('general')}
          className="bg-white rounded-3xl shadow-2xl p-8 text-center cursor-pointer 
                     transform transition-transform duration-300 hover:scale-105 hover:bg-blue-50
                     flex flex-col items-center max-w-sm"
        >
          <img 
            src="/models/masha.jpg" // Consider a simple 2D icon for selection
            alt="General Tutor" 
            className="w-32 h-32 mb-4 rounded-full border-4 border-blue-200" 
          />
          <h2 className="text-3xl font-bold text-blue-700 mb-2">Our Friendly Tutor</h2>
          <p className="text-gray-600 text-lg">Learn with our pre-made animated character!</p>
        </div>

        {/* Teacher Avatar Option */}
        <div 
          onClick={() => onSelect('teacher')}
          className="bg-white rounded-3xl shadow-2xl p-8 text-center cursor-pointer 
                     transform transition-transform duration-300 hover:scale-105 hover:bg-purple-50
                     flex flex-col items-center max-w-sm"
        >
          <img 
            src="/models/ashir.png" 
            alt="Teacher Avatar" 
            className="w-32 h-32 mb-4 rounded-full border-4 border-purple-200" 
          />
          <h2 className="text-3xl font-bold text-purple-700 mb-2">Your Teacher's Avatar</h2>
          <p className="text-gray-600 text-lg">See your teacher come to life!</p>
        </div>
      </div>
    </div>
  );
};

export default TutorSelection;