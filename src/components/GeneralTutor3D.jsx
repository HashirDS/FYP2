// 1. UPDATED GeneralTutor3D.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const GeneralTutor3D = ({ 
  modelPath, 
  scale = 1, 
  position = [0, -1, 0], 
  rotation = [0, 0, 0], 
  currentAnimation = 'idle',
  teachingContext = null,
  onAnimationComplete = null
}) => {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);
  
  // Animation state management
  const [activeAction, setActiveAction] = useState(null);
  const [availableAnimations, setAvailableAnimations] = useState([]);
  
  // Define animation mappings for teaching scenarios
  const animationMappings = {
    // Basic states
    'idle': ['Idle', 'T-Pose', 'Rest', 'Standing'],
    'talking': ['Talking', 'Speaking', 'Explaining', 'Mouth_Open'],
    'waving': ['Waving', 'Hello', 'Greeting', 'Wave'],
    'pointing': ['Pointing', 'Point', 'Indicating', 'Gesture'],
    'happy': ['Happy', 'Excited', 'Joy', 'Celebrating'],
    'thinking': ['Thinking', 'Confused', 'Pondering', 'Head_Scratch'],
    
    // Teaching specific animations
    'teaching_abc': ['pointing', 'talking', 'happy'],
    'teaching_numbers': ['pointing', 'talking', 'excited'],
    'teaching_shapes': ['pointing', 'talking', 'gesturing'],
    'teaching_colors': ['pointing', 'happy', 'talking'],
    'encouraging': ['happy', 'waving', 'thumbs_up'],
    'explaining': ['talking', 'pointing', 'gesturing']
  };

  // Initialize available animations
  useEffect(() => {
    if (animations && animations.length > 0) {
      const animNames = animations.map(anim => anim.name);
      setAvailableAnimations(animNames);
      // Add this after line 47 where you see "Available animations:"
console.log('Animation names:', animNames); // This will show all 20 names
    }
  }, [animations]);
  

  // Find best matching animation
  const findBestAnimation = (requestedAnimation) => {
    if (!availableAnimations.length) return null;
    
    const possibleNames = animationMappings[requestedAnimation] || [requestedAnimation];
    
    for (const name of possibleNames) {
      // Exact match
      const exactMatch = availableAnimations.find(anim => 
        anim.toLowerCase() === name.toLowerCase()
      );
      if (exactMatch) return exactMatch;
      
      // Partial match
      const partialMatch = availableAnimations.find(anim => 
        anim.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(anim.toLowerCase())
      );
      if (partialMatch) return partialMatch;
    }
    
    // Fallback to first available animation
    return availableAnimations[0];
  };

  // Animation control effect
  useEffect(() => {
    if (!actions || !mixer) return;

    const newAnimationName = findBestAnimation(currentAnimation);
    
    if (!newAnimationName) {
      console.warn('No suitable animation found for:', currentAnimation);
      return;
    }

    // Skip if same animation is already playing
    if (activeAction === newAnimationName) return;

    const newAction = actions[newAnimationName];
    if (!newAction) return;

    // Smooth transition between animations
    if (activeAction && actions[activeAction]) {
      actions[activeAction].fadeOut(0.3);
    }

    // Start new animation
    newAction.reset().fadeIn(0.3).play();
    
    // Handle teaching context animations
    if (teachingContext) {
      handleTeachingAnimation(newAnimationName);
    }

    setActiveAction(newAnimationName);
    console.log(`Playing animation: ${newAnimationName}`);

    // Cleanup function
    return () => {
      if (actions[activeAction]) {
        actions[activeAction].fadeOut(0.3);
      }
    };
  }, [actions, mixer, currentAnimation, activeAction, teachingContext]);

  // Handle teaching-specific animation sequences
  const handleTeachingAnimation = (animationName) => {
    if (!teachingContext) return;

    const { topic, action, duration } = teachingContext;
    
    // Set animation duration based on context
    if (actions[animationName]) {
      const action = actions[animationName];
      
      if (duration) {
        // Stop animation after specified duration
        setTimeout(() => {
          action.fadeOut(0.5);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, duration * 1000);
      }
      
      // Loop teaching animations appropriately
      if (['talking', 'explaining', 'teaching_abc'].includes(animationName)) {
        action.setLoop(2, Infinity); // Loop indefinitely
      } else {
        action.setLoop(1, 1); // Play once
      }
    }
  };

  // Clone scene for safety
  const clonedScene = useRef();
  useEffect(() => {
    if (scene) {
      clonedScene.current = scene.clone();
    }
  }, [scene]);

  // Optional: Add subtle movement when idle
  useFrame((state) => {
    if (group.current && currentAnimation === 'idle') {
      // Subtle breathing-like movement
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.01;
    }
  });

  return (
    <group ref={group} dispose={null}>
      {clonedScene.current && (
        <primitive 
          object={clonedScene.current} 
          scale={scale} 
          position={position} 
          rotation={rotation} 
        />
      )}
    </group>
  );
};

export default GeneralTutor3D;