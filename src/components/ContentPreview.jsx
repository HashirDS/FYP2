import React from 'react';
// --- 1. Import useNavigate ---
import { useNavigate } from 'react-router-dom';

const ContentCard = ({ title, description, icon }) => {
  // --- 2. Initialize the navigate function ---
  const navigate = useNavigate();

  // --- 3. Create the click handler ---
  const handleStartLearning = () => {
    // Check localStorage for user data
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    // --- 4. Add the navigation logic ---
    if (userId && userType === 'child') {
      // If user is a logged-in child, go straight to the dashboard
      navigate('/child-dashboard');
    } else {
      // If not logged in, or not a child, send to login/signup page
      navigate('/login');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 transform transition duration-300 hover:scale-105 hover:shadow-xl">
      <div className="text-4xl text-blue-500 mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {/* --- 5. Attach the handler to the button --- */}
      <button 
        onClick={handleStartLearning}
        className="bg-blue-500 text-white py-2 px-4 rounded-full text-sm font-semibold hover:bg-blue-600 transition duration-300"
      >
        Start teaching
      </button>
    </div>
  );
};

const ContentPreview = () => {
  return (
    <section className="py-16 px-4 bg-gray-100">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12 text-gray-800">Explore Our Fun Learning Activities</h2>

        {/* First row of cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <ContentCard
            title="ABC's"
            description="Fun-filled lessons to learn the alphabet with interactive animations."
            icon="🅰️"
          />
          <ContentCard
            title="Numbers"
            description="Count, add, and subtract with colorful and animated number characters."
            icon="🔢"
          />
          <ContentCard
            title="Shapes"
            description="Discover the world of shapes through engaging games and visuals."
            icon="🔺🟩"
          />
        </div>

        {/* Second row of cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ContentCard
            title="Colors"
            description="Learn to identify and name different colors with playful activities."
            icon="🎨"
          />
          <ContentCard
            title="Drawing Board"
            description="Unleash creativity and imagination with a free-style drawing canvas."
            icon="🖌️"
          />
          <ContentCard
            title="Listen Poems"
            description="Enjoy listening to fun and educational poems generated for kids."
            icon="🎶"
          />
        </div>

      </div>
    </section>
  );
};

export default ContentPreview;
