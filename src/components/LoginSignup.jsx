import React, { useState } from 'react';
// Assuming react-router-dom's useNavigate is available for routing
import { useNavigate } from 'react-router-dom';
// Icons for a cleaner, modern look
import { Mail, Lock, User, UserPlus, GraduationCap, Users } from 'lucide-react';

// Configuration
const API_URL = 'https://fyp2-jwrb.onrender.com'; // Match the Flask backend URL

// --- Input Field Component (Helper) ---
const InputField = ({ Icon, type, name, value, onChange, placeholder, required = true }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition duration-150 shadow-sm text-gray-700 placeholder-gray-400 font-medium"
        />
    </div>
);

// --- Main Login/Signup Component ---
const LoginSignup = () => {
    const navigate = useNavigate();

    // Initial state matching the required registration fields
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        user_type: 'child' // Default to 'child' for simplicity in children's app
    });

    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false); // New loading state for feedback

    // Validation helper
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Capitalize first letter for first_name and last_name
        let formattedValue = value;
        if (name === "first_name" || name === "last_name") {
            formattedValue = value
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter
        }

        setFormData({ ...formData, [name]: formattedValue });
    };


    // Helper to handle redirection based on user type
    const handleRedirection = (userType) => {
        if (userType === 'teacher') {
            navigate('/teacher-dashboard');
        } else {
            // Default and 'child' go to child dashboard
            navigate('/child-dashboard');
        }
    };

    // --- Sign Up Logic ---
    const handleSignUp = async () => {
        setLoading(true);
        const { first_name, last_name, email, password, user_type } = formData;

        if (!first_name || !last_name || !email || !password) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            setError('');
            setSuccessMessage('');

            const payload = {
                first_name,
                last_name,
                username: email, // Backend uses 'username' field for email
                password,
                user_type
            };

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Ensure user_id and user_type are stored locally if needed later
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user_type', data.user_type);

                setSuccessMessage(data.message || 'Account created successfully! Redirecting...');

                // Redirect based on the user_type returned by the backend
                setTimeout(() => handleRedirection(data.user_type), 1000);

            } else {
                setError(data.message || 'An error occurred during sign up.');
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError('Failed to connect to the backend server. Please check the server status.');
        } finally {
            setLoading(false);
        }
    };

    // --- Login Logic ---
    const handleLogin = async () => {
        setLoading(true);
        const { email, password } = formData;

        if (!email || !password) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }

        try {
            setError('');
            setSuccessMessage('');

            const payload = {
                username: email, // Backend uses 'username' field for email
                password
            };

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Store necessary data
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user_type', data.user_type);
                localStorage.setItem('first_name', data.first_name);
                localStorage.setItem('last_name', data.last_name);

                setSuccessMessage(data.message || 'Login successful! Redirecting...');

                // Redirect based on the user_type returned by the backend
                setTimeout(() => handleRedirection(data.user_type), 1000);

            } else {
                setError(data.message || 'Invalid email or password.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Failed to connect to the backend server. Please check the server status.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Component ---
    const formTitle = isLogin ? 'Log In to Smart Tutor' : 'Create Your Account';
    const formSubtitle = isLogin
        ? 'Welcome back! Let the learning begin.'
        : 'Sign up to start your personalized learning journey.';
    const actionText = isLogin ? 'Log In' : 'Sign Up';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl shadow-2xl border-t-8 border-indigo-500 transform transition-all duration-500 ease-in-out hover:shadow-3xl">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-8">
                    <GraduationCap className="w-12 h-12 text-indigo-600 mb-2" />
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center">{formTitle}</h2>
                    <p className="text-sm text-gray-500 text-center mt-1">{formSubtitle}</p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 shadow-sm font-semibold animate-in fade-in-0 duration-300">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 shadow-sm font-semibold animate-in fade-in-0 duration-300">
                        {successMessage}
                    </div>
                )}

                {/* Form Inputs */}
                <form onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignUp(); }} className="space-y-6">

                    {/* Sign Up Fields */}
                    {!isLogin && (
                        <>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <InputField
                                    Icon={User}
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ashir"
                                    required={!isLogin}
                                />
                                <InputField
                                    Icon={User}
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Mehfooz"
                                    required={!isLogin}
                                />

                            </div>

                            {/* User Type Selector */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-indigo-500" /> I am a:
                                </label>
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'child' }))}
                                        className={`flex-1 flex justify-center items-center py-3 rounded-xl transition duration-200 font-bold border-2 ${formData.user_type === 'child'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                            }`}
                                    >
                                        <UserPlus className="w-5 h-5 mr-2" /> Child
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'teacher' }))}
                                        className={`flex-1 flex justify-center items-center py-3 rounded-xl transition duration-200 font-bold border-2 ${formData.user_type === 'teacher'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                            }`}
                                    >
                                        <GraduationCap className="w-5 h-5 mr-2" /> Teacher
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email Input */}
                    <InputField
                        Icon={Mail}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                    />

                    {/* Password Input */}
                    <InputField
                        Icon={Lock}
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-bold text-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-[1.01]
                        ${loading
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-500/50'
                            }`}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : actionText}
                    </button>
                </form>

                {/* Footer Toggle */}
                <div className="mt-8 text-center text-gray-600">
                    <p className="text-sm">
                        {isLogin ? "New to Smart Tutor?" : "Already have an account?"}{' '}
                        <span
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(''); // Clear errors on toggle
                                setSuccessMessage('');
                                setLoading(false);
                            }}
                            className="text-indigo-600 font-semibold cursor-pointer hover:text-indigo-800 hover:underline transition duration-150"
                        >
                            {isLogin ? 'Create an Account' : 'Log In Here'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;
