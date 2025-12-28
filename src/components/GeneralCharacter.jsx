import React from 'react';

const GeneralCharacter = () => {
  return (
    <section className="py-16 px-4 bg-gray-200">
      <div className="container mx-auto flex flex-col md:flex-row-reverse items-center gap-8">

        {/* Image Placeholder */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img 
            src="https://i.pinimg.com/736x/02/5f/ea/025fea337b74d9785a82a515910b679e.jpg" 
            alt="Animated General Character" 
            className="w-full max-w-sm rounded-lg shadow-lg"
          />
        </div>

        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
             General Character
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Not a teacher? No problem! Your child can also learn from our friendly, animated general character. This character is always ready to teach, play, and explore new topics with your child.
          </p>
        </div>

      </div>
    </section>
  );
};

export default GeneralCharacter;