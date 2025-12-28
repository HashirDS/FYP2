import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

function Model() {
  // CORRECT: We pass the URL as a string to the useGLTF hook.
  // We DO NOT import the .glb file at the top.
  const { scene } = useGLTF('/character.glb'); 
  return <primitive object={scene} />;
}

function Character() {
  return (
    <div className="w-full h-96">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Model />
        <OrbitControls />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

export default Character;