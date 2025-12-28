import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Home, Menu, X } from 'lucide-react'; // Added Menu & X icons

const Navbar = () => {
    // State to toggle mobile menu
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                
                {/* 1. Logo Section */}
                <Link to="/" className="text-white text-2xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Home className="w-6 h-6" />
                    <span className="hidden sm:block">Smart Animated Tutor</span> {/* Hide text on very small screens if needed */}
                    <span className="sm:hidden">Tutor</span> {/* Short name for mobile */}
                </Link>

                {/* 2. Desktop Navigation (Hidden on Mobile) */}
                <div className="hidden md:flex space-x-4 items-center">
                    <Link to="/" className="text-white hover:text-gray-200 font-medium transition">Home</Link>
                    <Link to="/login" className="text-white hover:text-gray-200 font-medium transition">Login/Signup</Link>
                    
                    <Link to="/child-dashboard" 
                        className="text-white hover:text-white font-medium bg-blue-600 hover:bg-green-600 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
                    >
                        Child Dashboard
                    </Link>
                    
                    <Link to="/teacher-dashboard" 
                        className="flex items-center gap-1 text-white font-medium bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Teacher Dashboard
                    </Link>
                </div>

                {/* 3. Mobile Hamburger Button (Visible only on Mobile) */}
                <button 
                    className="md:hidden text-white focus:outline-none"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
            </div>

            {/* 4. Mobile Menu Dropdown (Shows when isMenuOpen is true) */}
            {isMenuOpen && (
                <div className="md:hidden mt-4 bg-white rounded-xl shadow-xl p-4 flex flex-col space-y-4 animate-in slide-in-from-top-5">
                    <Link to="/" onClick={toggleMenu} className="text-gray-800 hover:text-blue-600 font-medium text-lg border-b pb-2">
                        Home
                    </Link>
                    <Link to="/login" onClick={toggleMenu} className="text-gray-800 hover:text-blue-600 font-medium text-lg border-b pb-2">
                        Login/Signup
                    </Link>
                    <Link to="/child-dashboard" onClick={toggleMenu} className="text-center bg-blue-500 text-white py-2 rounded-lg font-bold shadow-md">
                        Child Dashboard
                    </Link>
                    <Link to="/teacher-dashboard" onClick={toggleMenu} className="flex justify-center items-center gap-2 bg-orange-500 text-white py-2 rounded-lg font-bold shadow-md">
                        <BarChart3 className="w-5 h-5" />
                        Teacher Dashboard
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;