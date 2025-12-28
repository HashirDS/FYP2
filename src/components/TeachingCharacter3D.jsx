import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

const TeachingCharacter3D = ({ 
  modelPath = "/models/rain.glb",
  scale = 0.015,
  position = [0, -1.2, 0],
  rotation = [0, Math.PI, 0],
  currentLesson = null,
  isTeaching = false,
  onAnimationComplete = () => {},
  onCharacterReady = () => {}
}) => {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);
  
  // State management
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [teachingState, setTeachingState] = useState('idle'); // idle, teaching, encouraging, celebrating
  const [error, setError] = useState(null);

  // Animation queue for sequencing multiple animations
  const [animationQueue, setAnimationQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Initialize character when loaded
  useEffect(() => {
    if (actions && names.length > 0 && !isLoaded) {
      console.log('Available animations:', names);
      setIsLoaded(true);
      onCharacterReady(names);
      
      // Start with idle animation
      playAnimation('idle');
    }
  }, [actions, names, isLoaded]);

  // Handle teaching state changes
  useEffect(() => {
    if (isTeaching && currentLesson) {
      startTeaching();
    } else if (!isTeaching) {
      returnToIdle();
    }
  }, [isTeaching, currentLesson]);

  // Animation control function
  const playAnimation = useCallback((animationName, duration = null, fadeTime = 0.5) => {
    if (!actions || !isLoaded) return;

    // Stop all current animations
    Object.values(actions).forEach(action => {
      if (action) action.stop();
    });

    // Find the best matching animation
    let targetAnimation = findBestAnimation(animationName);
    
    if (targetAnimation && actions[targetAnimation]) {
      console.log(`Playing animation: ${targetAnimation}`);
      
      const action = actions[targetAnimation];
      action.reset();
      action.fadeIn(fadeTime);
      
      if (duration) {
        action.setLoop(2201, 1); // Play once
        action.clampWhenFinished = true;
      } else {
        action.setLoop(2202, Infinity); // Loop indefinitely
      }
      
      action.play();
      setCurrentAnimation(targetAnimation);

      // Handle animation completion
      if (duration) {
        setTimeout(() => {
          action.fadeOut(fadeTime);
          onAnimationComplete(animationName);
          processNextInQueue();
        }, duration);
      }
    } else {
      console.warn(`Animation not found: ${animationName}, available:`, names);
    }
  }, [actions, names, isLoaded]);

  // Find best matching animation name
  const findBestAnimation = (requestedAnimation) => {
    const animationMappings = {
      'idle': ['idle', 'Idle', 'idle_001', 'T-Pose', 'Armature|mixamo.com|Layer0'],
      'teaching': ['explaining', 'Explaining', 'presenting', 'Presenting', 'pointing', 'Pointing'],
      'wave': ['wave', 'Wave', 'waving', 'Waving', 'hello', 'Hello'],
      'encouraging': ['clapping', 'Clapping', 'thumbs_up', 'ThumbsUp', 'yes', 'Yes'],
      'celebrating': ['dancing', 'Dancing', 'victory', 'Victory', 'happy', 'Happy'],
      'pointing': ['pointing', 'Pointing', 'indicating', 'Indicating']
    };

    const possibleNames = animationMappings[requestedAnimation] || [requestedAnimation];
    
    for (const name of possibleNames) {
      if (names.includes(name)) {
        return name;
      }
      // Try case-insensitive match
      const match = names.find(n => n.toLowerCase().includes(name.toLowerCase()));
      if (match) return match;
    }

    // Fallback to first available animation
    return names[0];
  };

  // Queue animation for sequential playback
  const queueAnimation = (animationName, duration = 3000) => {
    setAnimationQueue(prev => [...prev, { name: animationName, duration }]);
  };

  // Process animation queue
  const processNextInQueue = () => {
    if (animationQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true);
      const nextAnim = animationQueue[0];
      setAnimationQueue(prev => prev.slice(1));
      
      playAnimation(nextAnim.name, nextAnim.duration);
      
      setTimeout(() => {
        setIsProcessingQueue(false);
        if (animationQueue.length > 1) {
          processNextInQueue();
        }
      }, nextAnim.duration + 500);
    }
  };

  // Teaching sequence
  const startTeaching = () => {
    if (!currentLesson) return;
    
    setTeachingState('teaching');
    
    // Queue teaching animations based on lesson content
    const animationCue = currentLesson.animation_cue || 'teaching';
    
    // Start with greeting
    queueAnimation('wave', 2000);
    
    // Main teaching gesture
    queueAnimation(animationCue, 4000);
    
    // Encouraging gesture
    queueAnimation('encouraging', 2000);
    
    // Return to gentle idle
    setTimeout(() => {
      playAnimation('idle');
      setTeachingState('idle');
    }, 9000);
  };

  // Return to idle state
  const returnToIdle = () => {
    setTeachingState('idle');
    playAnimation('idle');
    setAnimationQueue([]); // Clear any queued animations
  };

  // Handle child interaction response
  const celebrateResponse = () => {
    setTeachingState('celebrating');
    queueAnimation('celebrating', 3000);
    
    setTimeout(() => {
      playAnimation('idle');
      setTeachingState('idle');
    }, 4000);
  };

  // Expose methods to parent component
  useEffect(() => {
    if (group.current && isLoaded) {
      group.current.teachingMethods = {
        startTeaching,
        celebrateResponse,
        playAnimation,
        returnToIdle
      };
    }
  }, [isLoaded, startTeaching, celebrateResponse, playAnimation, returnToIdle]);

  // Gentle floating animation for idle state
  useFrame((state) => {
    if (group.current && isLoaded && teachingState === 'idle') {
      // Subtle breathing effect
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      group.current.scale.set(scale * breathingScale, scale * breathingScale, scale * breathingScale);
      
      // Gentle floating
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
      
      // Subtle head turn
      if (currentAnimation.toLowerCase().includes('idle')) {
        group.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      }
    }
  });

  // Loading state
  if (!isLoaded && !error) {
    return (
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#e0e7ff" opacity={0.7} transparent />
        </mesh>
        {/* Loading indicator */}
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#6366f1" />
        </mesh>
      </group>
    );
  }

  // Error state
  if (error) {
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1.5, 0.5]} />
          <meshStandardMaterial color="#ef4444" opacity={0.8} transparent />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={scale}
        position={position}
        rotation={rotation}
        castShadow
        receiveShadow
      />
      
      {/* Dynamic lighting that follows character state */}
      <spotLight
        position={[position[0], position[1] + 3, position[2] + 2]}
        angle={0.4}
        penumbra={1}
        intensity={teachingState === 'celebrating' ? 1.2 : 0.8}
        color={teachingState === 'celebrating' ? '#ffd700' : '#ffffff'}
        castShadow
        target-position={position}
      />
      
      {/* Ambient glow for teaching state */}
      {isTeaching && (
        <pointLight
          position={[position[0], position[1] + 1, position[2]]}
          intensity={0.3}
          color="#4ade80"
          distance={3}
        />
      )}
    </group>
  );
};

// Preload the model
useGLTF.preload("/models/rain.glb");

export default TeachingCharacter3D;