// src/components/AvatarPage.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./Experience";

const AvatarPage = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
    </div>
  );
};

export default AvatarPage;
