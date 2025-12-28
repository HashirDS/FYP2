import React, { useState } from 'react';
import DrawingBoard from './DrawingBoard';
import ChildNavbar from './ChildNavbar';
// No TutorSelection needed
import DashboardHome from './DashboardHome';
import AbcLesson from './AbcLesson';
import NumLesson from './NumLesson';
import ShapesLesson from './ShapesLesson';
import ColorsLesson from './ColorsLesson';
import PoemsLesson from './PoemsLesson';
// --- Import FruitLesson ---
import FruitLesson from './FruitLesson'; // Ensure this path is correct

const ChildDashboard = () => {
  const [activeContent, setActiveContent] = useState('home');

  const renderContent = () => {
    switch (activeContent) {
      case 'drawing':
        return (
          // Added some basic styling for the container
          <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <DrawingBoard />
          </div>
        );
      case 'abc':
        return <AbcLesson />;
      case 'numbers':
        return <NumLesson />;
      case 'shapes':
        return <ShapesLesson />;
      case 'colors':
        return <ColorsLesson />;
      case 'poems':
        // Added some basic styling for the container
        return (
             <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
                 <PoemsLesson/>
             </div>
        );
      // --- Case for Fruits ---
      case 'fruits': // Make sure this matches the 'id' in ChildNavbar
        return <FruitLesson />;
      case 'home':
      default:
        // Pass setActiveContent so cards can navigate
        return <DashboardHome onSelectContent={setActiveContent} />;
    }
  };

  return (
    // Use a background that fits the overall theme, maybe gradient
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navbar is always visible */}
      <ChildNavbar onContentSelect={setActiveContent} activeContent={activeContent} />
      {/* Add padding top equal to navbar height to prevent content overlap */}
      <div className="pt-16"> {/* h-16 is the typical height of the navbar */}
         {renderContent()}
      </div>
    </div>
  );
};

export default ChildDashboard;

