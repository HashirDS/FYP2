import React from 'react'; // Added React import
// --- CORRECTED IMPORT PATH ---
// Assumes this file is in 'src/components/' and hook is in 'src/hooks/'
import { teachers, useAITeacher } from "../hooks/useAITeacher";
import { BookOpen } from 'lucide-react'; // Import an icon

export const BoardSettings = () => {
  // --- This is your original code ---
  const furigana = useAITeacher((state) => state.furigana);
  const setFurigana = useAITeacher((state) => state.setFurigana);

  const english = useAITeacher((state) => state.english);
  const setEnglish = useAITeacher((state) => state.setEnglish);

  const teacher = useAITeacher((state) => state.teacher);
  const setTeacher = useAITeacher((state) => state.setTeacher);

  const speech = useAITeacher((state) => state.speech);
  const setSpeech = useAITeacher((state) => state.setSpeech);

  const classroom = useAITeacher((state) => state.classroom);
  const setClassroom = useAITeacher((state) => state.setClassroom);
  // --- End original code ---

  // --- NEW: Get the lesson player function ---
  const playPredefinedLesson = useAITeacher((state) => state.playPredefinedLesson);
  const loading = useAITeacher((state) => state.loading); // To disable buttons
  // ---

  return (
    <>
      {/* --- Teacher Selection (Your original code) --- */}
      <div className="absolute right-0 bottom-full flex flex-row gap-10 mb-20">
        {teachers.map((sensei, idx) => (
          <div
            key={idx}
            className={`p-3 transition-colors duration-500 ${
              teacher === sensei ? "bg-white/80" : "bg-white/40"
            }`}
          >
            <div onClick={() => setTeacher(sensei)} className="cursor-pointer">
              <img
                src={`/images/${sensei}.jpg`}
                alt={sensei}
                className="object-cover w-40 h-40"
              />
            </div>
            <h2 className="text-3xl font-bold mt-3 text-center">{sensei}</h2>
          </div>
        ))}
      </div>
      
      {/* --- Classroom Selection (Your original code) --- */}
      <div className="absolute left-0 bottom-full flex flex-row gap-2 mb-20">
        <button
          className={` ${
            classroom === "default"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={() => setClassroom("default")}
        >
          Default classroom
        </button>
        <button
          className={` ${
            classroom === "alternative"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={() => setClassroom("alternative")}
        >
          Alternative classroom
        </button>
      </div>

      {/* --- *** NEW: Pre-defined Lesson Buttons (Below classroom buttons) *** --- */}
      {/* These are styled just like your classroom buttons, but smaller */}
      <div className="absolute left-0 bottom-full flex flex-row gap-2 mb-4">
        <button
          className="py-3 px-6 text-xl rounded-full transition-all duration-300 backdrop-blur-md bg-green-500/70 text-white hover:bg-green-600/90 shadow-lg transform hover:scale-105 flex items-center gap-2 disabled:opacity-50"
          onClick={() => playPredefinedLesson('abc')}
          disabled={loading}
        >
          <BookOpen className="w-5 h-5" /> ABC
        </button>
        <button
          className="py-3 px-6 text-xl rounded-full transition-all duration-300 backdrop-blur-md bg-blue-500/70 text-white hover:bg-blue-600/90 shadow-lg transform hover:scale-105 flex items-center gap-2 disabled:opacity-50"
          onClick={() => playPredefinedLesson('days')}
          disabled={loading}
        >
          <BookOpen className="w-5 h-5" /> Days
        </button>
         <button
          className="py-3 px-6 text-xl rounded-full transition-all duration-300 backdrop-blur-md bg-orange-500/70 text-white hover:bg-orange-600/90 shadow-lg transform hover:scale-105 flex items-center gap-2 disabled:opacity-50"
          onClick={() => playPredefinedLesson('fruits')}
          disabled={loading}
        >
          <BookOpen className="w-5 h-5" /> Fruits
        </button>
      </div>
      {/* --- *** END NEW *** --- */}
      
    </>
  );
};

export default BoardSettings; // Added default export