// src/components/voice/VoiceEnabledWrapper.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import VoiceController from "./VoiceController";

const VoiceEnabledWrapper = ({ children }) => {
  const navigate = useNavigate();

  const handleCommand = (cmd) => {
    console.log("Voice command:", cmd);

    switch (cmd) {
      case "drawing":
        navigate("/drawing-board");
        break;
      case "poems":
        navigate("/poems-lesson");
        break;
      case "abc":
        navigate("/abc-lesson");
        break;
      case "shapes":
        navigate("/shapes-lesson");
        break;
      case "numbers":
        navigate("/num-lesson");
        break;
      case "colors":
        navigate("/colors-lesson");
        break;
      case "teacher":
        navigate("/teacher-dashboard");
        break;
      case "home":
        navigate("/");
        break;
      default:
        console.log("Unknown command:", cmd);
    }
  };

  return (
    <div className="relative">
      {children}
      <VoiceController onCommand={handleCommand} />
    </div>
  );
};

export default VoiceEnabledWrapper;
