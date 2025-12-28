import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // <--- IMPORT THIS for navigation
import { Calendar, Award, ChevronDown, ChevronUp, Activity, BarChart3, BrainCircuit, Loader2, Lightbulb, AlertTriangle, ArrowRight, Mic } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';

const API_URL = 'http://127.0.0.1:5000';

const QuizHistory = ({ studentId, refreshTrigger = 0 }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchHistory();
    }
  }, [studentId, refreshTrigger]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quiz-analytics/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        
        const sortedHistory = (data.quiz_history || []).sort((a, b) => 
          new Date(b.completed_at || 0) - new Date(a.completed_at || 0)
        );
        setHistory(sortedHistory);
        setStats(data.category_statistics || {});

        if (data.dashboard_recommendation) {
          setRecommendation(data.dashboard_recommendation);
        }
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Today';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
    });
  };

  // --- 🧭 SMART LINK MAPPER (Connects Backend Topics to Your App Routes) ---
  const getLessonLink = (topic) => {
    const t = topic.toLowerCase();
    switch (t) {
        case 'abc': return '/abc-lesson';
        case 'numbers': return '/num-lesson';
        case 'shapes': return '/shapes-lesson';
        case 'colors': return '/colors-lesson';
        case 'poems': return '/poems-lesson';
        case 'drawing': return '/drawing-board';
        default: return '/general-character'; // Fallback to main character
    }
  };

  // --- PREPARE CHART DATA ---
  const allCategories = ['abc', 'numbers', 'colors', 'shapes', 'fruits', 'veg', 'animals', 'body', 'days'];
  
  const chartData = allCategories.map(catKey => {
    const catStat = stats[catKey];
    const score = catStat ? Math.round(catStat.avg_percentage) : 0;
    const attempts = catStat ? catStat.attempts : 0;
    
    let color = '#d1d5db'; 
    if (attempts > 0) {
        if (score >= 80) color = '#22c55e'; 
        else if (score >= 50) color = '#eab308'; 
        else color = '#ef4444'; 
    }

    return {
      name: catKey.charAt(0).toUpperCase() + catKey.slice(1), 
      score: score,
      attempts: attempts,
      fill: color
    };
  });

  const weakAreas = chartData.filter(d => d.attempts > 0 && d.score < 50).map(d => d.name);
  const untouched = chartData.filter(d => d.attempts === 0).length;

  if (!studentId) return null;

  return (
    <div className="mt-8 w-full max-w-4xl bg-white rounded-3xl shadow-xl border-4 border-blue-50 overflow-hidden animate-fade-in mx-auto">
      
      {/* --- HEADER --- */}
      <div className="bg-blue-100 p-6 border-b border-blue-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-3">
          <Activity className="w-6 h-6" /> Learning Analysis
        </h2>
        <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          {history.length} Quizzes
        </span>
      </div>

      <div className="p-6 bg-gray-50 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
             <Loader2 className="animate-spin w-8 h-8 text-blue-500 mb-2"/>
             <p>Analyzing performance...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">
            No history yet. Play a game to see stats!
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* --- 🌟 SMART RECOMMENDATION BANNER 🌟 --- */}
            {recommendation && (
               <div className={`p-5 rounded-2xl border-l-8 shadow-md flex flex-col sm:flex-row items-start gap-4 transition-all
                 ${recommendation.status === 'priority' 
                   ? 'bg-red-50 border-red-500 text-red-800'
                   : recommendation.status === 'next_step'
                   ? 'bg-green-50 border-green-500 text-green-800'
                   : 'bg-blue-50 border-blue-500 text-blue-800'
                 }`}>
                 
                 <div className={`p-3 rounded-full shrink-0 ${recommendation.status === 'priority' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {recommendation.status === 'priority' ? <AlertTriangle className="w-6 h-6"/> : <Lightbulb className="w-6 h-6"/>}
                 </div>

                 <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      Smart Tutor Says:
                    </h3>
                    <p className="mt-1 text-sm font-medium opacity-90">{recommendation.message}</p>
                    
                    {/* --- 🔗 DYNAMIC LINK TO LESSON --- */}
                    <Link to={getLessonLink(recommendation.topic)} 
                       className={`mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-transform hover:scale-105
                       ${recommendation.status === 'priority' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                       <Mic className="w-4 h-4" /> {/* Icon showing "Speech/Practice" */}
                       Practice {recommendation.topic.toUpperCase()} Now <ArrowRight className="w-4 h-4"/>
                    </Link>
                 </div>
               </div>
            )}

            {/* --- 📊 AI CHART --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600"/> Proficiency Map
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Performance across different topics.
                        </p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 max-w-sm w-full">
                        <div className="font-bold flex items-center gap-1 mb-1"><BrainCircuit className="w-3 h-3"/> AI Insight:</div>
                        {untouched > 0 
                            ? `You have ${untouched} topics left to explore!` 
                            : weakAreas.length > 0 
                                ? `Let's focus on fixing: ${weakAreas.join(", ")}.` 
                                : `Great job! You are strong across the board.`}
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize: 10, fontWeight: 'bold', fill: '#6b7280'}} 
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                            />
                            <YAxis domain={[0, 100]} tick={{fontSize: 10}} unit="%" />
                            <Tooltip 
                                cursor={{fill: '#f9fafb'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- 📝 HISTORY LIST --- */}
            <div>
                <h3 className="font-bold text-gray-700 flex items-center gap-2 pl-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400"/> Recent Activity
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((quiz, index) => (
                    <div key={index} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-all">
                        <div onClick={() => toggleRow(index)} className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${quiz.percentage >= 80 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Award className="w-4 h-4" />
                            </div>
                            <div>
                            <h3 className="font-bold text-gray-800 text-sm capitalize">
                                {quiz.category || 'Quiz'}
                            </h3>
                            <div className="text-[10px] text-gray-400">
                                {formatDate(quiz.completed_at)}
                            </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-black ${quiz.percentage >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                                {quiz.percentage}%
                            </span>
                            {expandedRow === index ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
                        </div>
                        </div>
                        {expandedRow === index && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs flex justify-between">
                            <span>Total Qs: <b>{quiz.total_questions}</b></span>
                            <span>Correct: <b>{quiz.score}</b></span>
                            <span>Time: <b>{quiz.time_elapsed}s</b></span>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;