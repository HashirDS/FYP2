import React from 'react';

const TeacherAvatar = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-8">

        {/* Image/Illustration Placeholder */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="w-80 h-80 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-6xl text-gray-500">👩‍🏫</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            Create Your 3D Avatar
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Teachers can upload a picture of themselves to create a personalized 3D avatar that can teach students, ensuring a familiar face is always there to guide their learning journey.
          </p>
        </div>

      </div>
    </section>
  );
};

export default TeacherAvatar;