import React from 'react';

// Placeholder Footer component
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto text-center px-4">
        <div className="text-sm text-gray-400 border-t border-gray-700 pt-4 mt-4">
          © {new Date().getFullYear()} Smart Animated Tutor. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

