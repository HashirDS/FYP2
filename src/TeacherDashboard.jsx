import React from 'react';
import Navbar from './Navbar'; // Reusing the Navbar for now

const TeacherDashboard = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-8">
          Teacher Dashboard
        </h1>

        {/* Avatar Creation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Your 3D Avatar</h2>
          <p className="text-gray-600 mb-4">
            Upload your picture to create a personalized 3D animated avatar for your students.
          </p>
          <div className="flex justify-center items-center gap-4">
            <input
              type="file"
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100"
            />
            <button className="bg-purple-600 text-white py-2 px-6 rounded-full hover:bg-purple-700">
              Generate Avatar
            </button>
          </div>
        </div>

        {/* Content Management Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manage Learning Content</h2>
          <p className="text-gray-600 mb-4">
            View and manage the learning modules available to your students.
          </p>
          <button className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700">
            View Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;