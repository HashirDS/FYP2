// src/components/voice/VoiceController.jsx
import React, { useEffect, useState } from "react";

const VoiceController = ({ onCommand }) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Speech Recognition not supported — use Chrome or Edge.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const last = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            setTranscript(last);

            if (last.includes("drawing")) onCommand("drawing");
            else if (last.includes("poem")) onCommand("poems");
            else if (last.includes("abc") || last.includes("alphabets")) onCommand("abc");
            else if (last.includes("number")) onCommand("numbers");
            else if (last.includes("shape")) onCommand("shapes");
            else if (last.includes("color") || last.includes("colour")) onCommand("colors");
            else if (last.includes("home")) onCommand("home");
            else if (last.includes("teacher")) onCommand("teacher");
        };

        recognition.onerror = (err) => {
            console.error("Speech recognition error:", err);
            recognition.stop();
        };

        if (listening) recognition.start();
        return () => recognition.stop();
    }, [listening]);

    return (
        <div className="fixed top-20 right-15 bg-white p-3 rounded-xl shadow-lg z-50">
            <button
                onClick={() => setListening((prev) => !prev)}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
            >
                {listening ? "🎙 Stop" : "🎤 Start"}
            </button>
            <p className="mt-2 text-sm text-gray-700">Heard: {transcript}</p>
        </div>

    );
};

export default VoiceController;
