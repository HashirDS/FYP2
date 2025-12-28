import { create } from 'zustand';

// ✅ Auto-detect backend (use same machine IP if deployed)
const FLASK_BASE_URL = 'http://127.0.0.1:5000'; // keep same if running locally

// --- 🛠️ UPDATE HERE: Add "rpm" to the list of teachers ---
export const teachers = ["female", "male", "rpm"]; 

// --- NEW: Pre-defined lesson scripts ---
// We add all our pre-defined English lessons here.
// The backend /api/tts will speak this text using the selected voice.
const predefinedLessons = {
  abc: "Let's learn our ABCs! A, B, C, D,! say again A, B, C, D wow nice try can you want again !",
  fruits: "Let's Learn the Fruits Names!  Apples, Bananas, Oranges, and Grapes!",
  days: "Let's learn the days of the week! Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday."
};
// --- End New ---

export const useAITeacher = create((set, get) => ({
    messages: [],
    currentMessage: null,
    teacher: teachers[0],
    setTeacher: (teacher) => {
        set(() => ({
            teacher,
            messages: get().messages.map((message) => {
                // Reset visemes/audio when teacher changes
                message.audioPlayer = null;
                message.visemes = [];
                return message;
            }),
        }));
    },
    classroom: "default",
    setClassroom: (classroom) => set({ classroom }),

    loading: false,
    furigana: false,
    setFurigana: (furigana) => set({ furigana }),

    english: true,
    setEnglish: (english) => set({ english }),

    speech: "simple",
    setSpeech: (speech) => set({ speech }),

    // ------------------------------------------------
    // 🚀 Main Function: Ask AI (Unchanged)
    // ------------------------------------------------
    askAI: async (question) => {
        if (!question) return;

        const message = { question, id: get().messages.length };
        set({ loading: true });

        try {
            const speechLevel = get().speech;

            const res = await fetch(
                `${FLASK_BASE_URL}/api/ai?question=${encodeURIComponent(question)}&speech=${speechLevel}`,
                { headers: { "Accept": "application/json" } }
            );

            if (!res.ok) {
                console.error("AI API Call Failed:", res.status, await res.text());
                // --- ADDED: Create a simple fallback message ---
                message.answer = { text: "Sorry, I had a problem thinking. Please try again!" };
                set({ loading: false, currentMessage: message, messages: [...get().messages, message] });
                get().playMessage(message); // Play the error message
                return;
                // ---
            }

            const data = await res.json();
            message.answer = data;
            message.speech = speechLevel;

            set({
                currentMessage: message,
                messages: [...get().messages, message],
                loading: false,
            });

            get().playMessage(message);
        } catch (err) {
            console.error("AI Request Error:", err);
            set({ loading: false });
        }
    },

    // ------------------------------------------------
    // 🗣️ Play Message (TTS + Viseme Sync)
    // ------------------------------------------------
    playMessage: async (message) => {
        set({ currentMessage: message });

        if (!message.audioPlayer) {
            set({ loading: true });

            try {
                // --- *** FIX: This now works for AI *and* pre-defined lessons *** ---
                const textToSpeak = message.answer.text // Check for pre-defined text first
                                ? message.answer.text 
                                // Otherwise, get text from the (Japanese) AI response
                                : message.answer.japanese.map((word) => word.word).join(" ");
                // --- *** END FIX *** ---

                const audioRes = await fetch(
                    `${FLASK_BASE_URL}/api/tts?teacher=${get().teacher}&text=${encodeURIComponent(textToSpeak)}`,
                    { headers: { "Accept": "audio/mpeg" } }
                );

                if (!audioRes.ok) {
                    console.error("TTS API Call Failed:", audioRes.status, await audioRes.text());
                    set({ loading: false, currentMessage: null });
                    return;
                }

                // ✅ FIX: Ensure viseme header parsed safely
                const visemesHeader = audioRes.headers.get("Visemes");
                let visemes = [];
                try {
                    visemes = JSON.parse(visemesHeader || "[]");
                } catch (e) {
                    console.warn("Viseme parse failed:", e);
                }

                const audioBlob = await audioRes.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audioPlayer = new Audio(audioUrl);

                message.visemes = visemes;
                message.audioPlayer = audioPlayer;

                audioPlayer.onended = () => set({ currentMessage: null });

                set({
                    loading: false,
                    messages: get().messages.map((m) => (m.id === message.id ? message : m)),
                });
            } catch (err) {
                console.error("TTS Request Error:", err);
                set({ loading: false, currentMessage: null });
            }
        }

        // Play audio
        if (message.audioPlayer) {
            message.audioPlayer.currentTime = 0;
            message.audioPlayer.play();
        }
    },

    // ------------------------------------------------
    // 🛑 Stop Message (Unchanged)
    // ------------------------------------------------
    stopMessage: (message) => {
        if (message.audioPlayer) {
            message.audioPlayer.pause();
            message.audioPlayer.currentTime = 0;
        }
        set({ currentMessage: null });
    },

    // --- *** NEW: Function to play pre-defined lessons *** ---
    playPredefinedLesson: (lessonKey) => {
        const text = predefinedLessons[lessonKey];
        if (!text) {
            console.error(`Lesson "${lessonKey}" not found.`);
            return;
        }

        // Stop any current message
        if (get().currentMessage) {
            get().stopMessage(get().currentMessage);
        }

        // Create a message object that mimics the AI response structure
        const message = {
            id: lessonKey + Date.now(),
            question: `Play lesson: ${lessonKey}`,
            answer: {
                text: text, // This is the pre-defined English text
                // Add dummy data for other fields to prevent errors
                japanese: [{ word: text, reading: "" }], 
                grammarBreakdown: [],
            },
            speech: "simple",
            audioPlayer: null, 
            visemes: [],
        };

        // Call playMessage with our pre-defined text
        get().playMessage(message);
    },
    // --- *** END NEW Function *** ---
}));