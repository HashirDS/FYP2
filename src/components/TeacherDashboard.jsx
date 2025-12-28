import React, { useState, useEffect, useMemo } from 'react';
// Find this line at the top and add FileText
import { Users, AlertCircle, Loader, BarChart3, PieChart, Activity, XCircle, UserCheck, Star, Trophy, Target, Mic, Volume2, TrendingUp, NotebookPen, FileText } from 'lucide-react';

import Navbar from './Navbar';
import PaperGenerator from './PaperGenerator'; // <--- NEW IMPORT ADDED
//import { Users, AlertCircle, Loader, BarChart3, PieChart, Activity, XCircle, UserCheck, Star, Trophy, Target, Mic, Volume2, TrendingUp, NotebookPen } from 'lucide-react'; // <--- NotebookPen ADDED
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

// Configuration for the API
const API_URL = 'http://127.0.0.1:5000';

// --- UPDATED: Colors and Categories ---
const CATEGORY_COLORS = {
  abc: '#8884d8',
  numbers: '#82ca9d',
  shapes: '#ffc658',
  colors: '#ff8042',
  poems: '#8dd1e1',
  fruits: '#d0ed57',
};
const ALL_CATEGORIES = ['abc', 'numbers', 'shapes', 'colors', 'poems', 'fruits'];
const PIE_COLORS = ALL_CATEGORIES.map(cat => CATEGORY_COLORS[cat] || '#888888');
// ---

// --- UPDATED: Speech Analytics Component (without Recent Attempts Table) ---
const SpeechAnalyticsView = ({ student }) => {
  const [speechData, setSpeechData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      fetchSpeechAnalytics(student._id);
    }
  }, [student]);

  const fetchSpeechAnalytics = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/speech-analytics/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSpeechData(data);
      } else {
        setSpeechData(null);
      }
    } catch (error) {
      console.error("Error fetching speech analytics:", error);
      setSpeechData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  // Prepare data for accuracy trend chart
  const accuracyTrendData = useMemo(() => {
    if (!speechData?.speech_history) return [];

    return speechData.speech_history
      .slice(-10) // Last 10 attempts
      .map((attempt, index) => ({
        attempt: index + 1,
        accuracy: attempt.accuracy,
        lesson: attempt.lesson_type,
        expected: attempt.expected,
        recognized: attempt.recognized
      }));
  }, [speechData]);
  

  // Prepare data for lesson type distribution
  const lessonDistributionData = useMemo(() => {
    if (!speechData?.lesson_statistics) return [];

    return Object.entries(speechData.lesson_statistics).map(([lesson, stats]) => ({
      name: lesson.charAt(0).toUpperCase() + lesson.slice(1),
      attempts: stats.attempts,
      avgAccuracy: stats.avg_accuracy,
      wordsCount: stats.words_count
    }));
  }, [speechData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <Mic className="w-6 h-6 mr-3 text-purple-600" />
        Speech & Pronunciation Analytics
      </h3>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading speech data...</span>
        </div>
      ) : speechData ? (
        <div className="space-y-6">
          {/* Speech Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Attempts</p>
                  <p className="text-2xl font-bold text-blue-600">{speechData.total_attempts}</p>
                </div>
                <Volume2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">{speechData.average_accuracy}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Speech Points</p>
                  <p className="text-2xl font-bold text-purple-600">{speechData.total_points_earned}</p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Lessons Used</p>
                  <p className="text-2xl font-bold text-orange-600">{Object.keys(speechData.lesson_statistics || {}).length}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy Trend Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Accuracy Trend (Last 10 Attempts)</h4>
              {accuracyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={accuracyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attempt" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                      labelFormatter={(label) => `Attempt ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Not enough data for trend analysis
                </div>
              )}
            </div>

            {/* Lesson Distribution Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Attempts by Lesson Type</h4>
              {lessonDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={lessonDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attempts" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                      {lessonDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#888888'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No lesson distribution data
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Mic className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p>No speech data available for this student yet.</p>
          <p className="text-sm">Speech data will appear when the student uses voice features.</p>
        </div>
      )}
    </div>
  );
};

// --- DashboardStats Component ---
const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatCard icon={<Users />} title="Total Students" value={stats.totalStudents} color="text-blue-500" />
    <StatCard icon={<Trophy />} title="Total Items Learned" value={stats.totalItems} color="text-green-500" />
    <StatCard icon={<Star />} title="Most Active Student" value={stats.topStudent} color="text-yellow-500" />
    <StatCard icon={<Target />} title="Most Popular Category" value={stats.topCategory} color="text-purple-500" />
  </div>
);

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 flex items-center space-x-4 animate-fade-in">
    <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text', 'bg').replace('-500', '-100')}`}>
      {React.cloneElement(icon, { className: `w-6 h-6 ${color}` })}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- StudentDetailView Component ---
const StudentDetailView = ({ student }) => {
  if (!student) return null;

  const studentCategoryData = useMemo(() => {
    const totals = {};
    ALL_CATEGORIES.forEach(cat => totals[cat] = 0);
    if (student.completed_items && typeof student.completed_items === 'object') {
      for (const [category, items] of Object.entries(student.completed_items)) {
        if (totals.hasOwnProperty(category) && Array.isArray(items)) {
          totals[category] = items.length;
        }
      }
    }
    return ALL_CATEGORIES.map(category => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      Items: totals[category],
      fill: CATEGORY_COLORS[category] || '#888888'
    }));
  }, [student]);

  const completedLists = useMemo(() => {
    return ALL_CATEGORIES
      .map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        color: CATEGORY_COLORS[category] || '#888888',
        items: student.completed_items[category] || []
      }))
      .filter(category => category.items.length > 0);
  }, [student]);

  return (
    <>
      <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fade-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <UserCheck className="w-6 h-6 mr-3 text-green-600" />
          Individual Progress: {student.child_name || `Child ${student._id.slice(-4)}`}
        </h3>
        <p className="text-lg text-gray-600 mb-6">Total Score: <span className="font-bold text-purple-600">{student.total_score || 0}</span></p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Completion by Category</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={studentCategoryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Items" radius={[0, 5, 5, 0]}>
                  {studentCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Completed Items List</h4>
            {completedLists.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 border rounded-lg p-3 bg-gray-50">
                {completedLists.map(category => (
                  <div key={category.name} className="text-sm">
                    <strong style={{ color: category.color }} className="text-base block border-b pb-1 mb-1">{category.name} ({category.items.length})</strong>
                    <p className="text-gray-600 break-words leading-relaxed">
                      {category.items.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500 rounded-lg bg-gray-50">
                This student hasn't completed any items yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speech Analytics Section */}
      <SpeechAnalyticsView student={student} />
    </>
  );
};

// --- InteractiveProgressDashboard Component ---
const InteractiveProgressDashboard = () => {
  const [allProgressData, setAllProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/progress/all_children`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Failed to fetch progress data.' }));
          throw new Error(errData.message || 'Failed to fetch progress data.');
        }
        const data = await response.json();
        const processedData = data.map(student => ({
          ...student,
          completed_items: {
            ...ALL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: [] }), {}),
            ...(student.completed_items || {})
          }
        }));
        setAllProgressData(processedData);
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const categoryTotalsData = useMemo(() => {
    const totals = {};
    ALL_CATEGORIES.forEach(cat => totals[cat] = 0);
    let maxOverall = 0;
    allProgressData.forEach(student => {
      if (student.completed_items) {
        for (const [category, items] of Object.entries(student.completed_items)) {
          if (totals.hasOwnProperty(category) && Array.isArray(items)) {
            totals[category] += items.length;
          }
        }
      }
    });
    maxOverall = Math.max(...Object.values(totals), 1);
    return ALL_CATEGORIES.map(category => ({
      subject: category.charAt(0).toUpperCase() + category.slice(1),
      A: totals[category],
      fullMark: Math.max(maxOverall, 5)
    }));
  }, [allProgressData]);

  const studentScoreData = useMemo(() => {
    return allProgressData
      .map(student => ({
        name: student.child_name || `Child ${student._id.slice(-4)}`,
        score: student.total_score || 0,
        id: student._id
      }))
      .sort((a, b) => b.score - a.score);
  }, [allProgressData]);

  const selectedStudentData = useMemo(() => {
    let targetData;
    if (!selectedStudentId) {
      const classTotals = {}; ALL_CATEGORIES.forEach(cat => classTotals[cat] = 0);
      let studentCount = allProgressData.length || 1;
      allProgressData.forEach(student => {
        if (student.completed_items) {
          for (const [category, items] of Object.entries(student.completed_items)) {
            if (classTotals.hasOwnProperty(category) && Array.isArray(items)) {
              classTotals[category] += items.length;
            }
          }
        }
      });
      targetData = Object.entries(classTotals).map(([category, total]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: parseFloat((total / studentCount).toFixed(1))
      }));
    } else {
      const student = allProgressData.find(s => s._id === selectedStudentId);
      if (!student) return [];
      targetData = Object.entries(student.completed_items)
        .map(([category, items]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: Array.isArray(items) ? items.length : 0
        }));
    }
    return targetData.filter(item => item.value > 0);
  }, [selectedStudentId, allProgressData]);

  const popularItemsData = useMemo(() => {
    const itemCounts = new Map();
    allProgressData.forEach(student => {
      if (student.completed_items) {
        Object.values(student.completed_items).flat().forEach(item => {
          if (item) {
            itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
          }
        });
      }
    });
    return Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allProgressData]);

  const dashboardStats = useMemo(() => {
    const totalStudents = allProgressData.length;
    const totalItems = categoryTotalsData.reduce((acc, cat) => acc + cat.A, 0);
    const topStudent = studentScoreData[0]?.name || "N/A";
    const topCategory = [...categoryTotalsData].sort((a, b) => b.A - a.A)[0]?.subject || "N/A";
    return { totalStudents, totalItems, topStudent, topCategory };
  }, [allProgressData, categoryTotalsData, studentScoreData]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return allProgressData.find(s => s._id === selectedStudentId);
  }, [selectedStudentId, allProgressData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10 h-64">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Loading Interactive Dashboard...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center">
        <AlertCircle className="w-5 h-5 mr-3" />
        <strong>Error:</strong> {error}
      </div>
    );
  }
  if (allProgressData.length === 0) {
    return (
      <div className="text-center p-10 bg-gray-100 rounded-xl h-64 flex flex-col justify-center">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">No Student Data Found</h3>
        <p className="text-gray-500">As children complete lessons, their progress will appear here.</p>
      </div>
    );
  }

  const selectedStudentName = selectedStudent
    ? selectedStudent.child_name || "Selected Student"
    : "Overall Class Average";

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value, index }) => {
    const labelRadius = outerRadius + 25;
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
    const lineStartX = cx + (outerRadius + 2) * Math.cos(-midAngle * RADIAN);
    const lineStartY = cy + (outerRadius + 2) * Math.sin(-midAngle * RADIAN);
    const lineEndX = cx + (outerRadius + 15) * Math.cos(-midAngle * RADIAN);
    const lineEndY = cy + (outerRadius + 15) * Math.sin(-midAngle * RADIAN);

    const fill = CATEGORY_COLORS[name.toLowerCase()] || '#888888';

    return (
      <g>
        <text x={x} y={y} fill="#4B5563" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
          {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
        <path d={`M${lineStartX},${lineStartY} L${lineEndX},${lineEndY} L${x},${y}`} stroke={fill} fill="none" strokeWidth={1} />
        <circle cx={lineStartX} cy={lineStartY} r={2} fill={fill} stroke="none" />
      </g>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <DashboardStats stats={dashboardStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Student Leaderboard */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Student Leaderboard (Total Score)
          </h3>
          <p className="text-sm text-gray-500 mb-4">Click a student to see their individual progress below.</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={studentScoreData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                dataKey="name" type="category" width={80}
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={false} tickLine={false} interval={0}
              />
              <Tooltip cursor={{ fill: 'rgba(233, 233, 233, 0.3)' }} />
              <Bar dataKey="score" radius={[0, 5, 5, 0]} barSize={20}>
                {studentScoreData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.id === selectedStudentId ? '#82ca9d' : '#8884d8'}
                    onClick={() => setSelectedStudentId(entry.id === selectedStudentId ? null : entry.id)}
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Selected Student/Class Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              {selectedStudentName}
            </h3>
            {selectedStudentId && (
              <button onClick={() => setSelectedStudentId(null)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Show Class Average">
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
          {selectedStudentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <RechartsPieChart margin={{ top: 20, right: 40, bottom: 60, left: 40 }}>
                <Pie
                  data={selectedStudentData} cx="50%" cy="50%"
                  labelLine={true} label={renderCustomizedLabel}
                  outerRadius={85} innerRadius={45}
                  fill="#8884d8" dataKey="value" paddingAngle={2}
                >
                  {selectedStudentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#888888'} stroke="white" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => selectedStudentId ? value : value.toFixed(1)} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '25px', fontSize: '12px' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-center text-gray-500 p-4">
              {selectedStudentId ? "This student hasn't completed any items yet." : "No class data available to display."}
            </div>
          )}
        </div>

        {/* Chart 3: Overall Class Activity */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Class Activity by Category
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryTotalsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#374151' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} allowDecimals={false} />
              <Radar name="Items Completed" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Most Popular Items */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Most Popular Items (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={popularItemsData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12, fill: '#374151' }} />
              <Tooltip />
              <Bar dataKey="count" name="Completions" fill="#ffc658" radius={[0, 5, 5, 0]}>
                {popularItemsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conditional Single Student Detail View */}
      {selectedStudent && (
        <StudentDetailView student={selectedStudent} />
      )}
    </>
  );
};

// --- Main Teacher Dashboard (REPLACED AND UPDATED) ---
const TeacherDashboard = () => {
  // ⭐ NEW STATE FOR VIEW SELECTION ⭐
  const [activeView, setActiveView] = useState('progress'); // 'progress' or 'generator'

  const renderContent = () => {
    if (activeView === 'progress') {
      return (
        <>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Student Progress Overview</h2>
          <InteractiveProgressDashboard />
        </>
      );
    } else if (activeView === 'generator') {
      // ⭐ RENDER THE NEW COMPONENT ⭐
      return (
        <PaperGenerator />
      );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-7xl">

        {/* --- View Toggles (Tabs/Buttons) --- */}
        <div className="flex space-x-4 border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveView('progress')}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${activeView === 'progress'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-500 hover:text-blue-400'
              } flex items-center`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Live Progress
          </button>
          <button
            onClick={() => setActiveView('generator')}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${activeView === 'generator'
                ? 'text-green-600 border-b-4 border-green-600'
                : 'text-gray-500 hover:text-green-400'
              } flex items-center`}
          >
            <NotebookPen className="w-5 h-5 mr-2" />
            Worksheet Generator
          </button>
        </div>

        {/* --- Dynamic Content Rendering --- */}
        <div className="p-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
// Add this component after SpeechAnalyticsView
const QuizAnalyticsView = ({ student }) => {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      fetchQuizAnalytics(student._id);
    }
  }, [student]);

  const fetchQuizAnalytics = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quiz-analytics/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizData(data);
      } else {
        setQuizData(null);
      }
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      setQuizData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <Trophy className="w-6 h-6 mr-3 text-blue-600" />
        Quiz Performance Analytics
      </h3>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading quiz data...</span>
        </div>
      ) : quizData && quizData.total_quizzes > 0 ? (
        <div className="space-y-6">
          {/* Quiz Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Quizzes</p>
                  <p className="text-2xl font-bold text-blue-600">{quizData.total_quizzes}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Avg Score</p>
                  <p className="text-2xl font-bold text-green-600">{quizData.average_score}</p>
                </div>
                <Star className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Avg Percentage</p>
                  <p className="text-2xl font-bold text-purple-600">{quizData.average_percentage}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Categories</p>
                  <p className="text-2xl font-bold text-orange-600">{Object.keys(quizData.category_statistics || {}).length}</p>
                </div>
                <Target className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Trend Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Score Trend (Last 10 Quizzes)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={quizData.quiz_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(entry, index) => index + 1} />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip formatter={(value) => [value, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={3} />
                  <Line type="monotone" dataKey="total_questions" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Performance by Category</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(quizData.category_statistics || {}).map(([cat, stats]) => ({
                  name: cat.toUpperCase(),
                  percentage: stats.avg_percentage,
                  attempts: stats.attempts
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p>No quiz data available for this student yet.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;