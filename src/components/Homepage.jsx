import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import ContentPreview from './ContentPreview';
import TeacherAvatar from './TeacherAvatar';
import GeneralCharacter from './GeneralCharacter';
 // import Cards from './Cards';

const Homepage = () => {
  return (
    <div className="homepage-container">
      <Navbar />
      <Hero />
      <ContentPreview />
      <TeacherAvatar />
      <GeneralCharacter />
    </div>
  );
};


export default Homepage;