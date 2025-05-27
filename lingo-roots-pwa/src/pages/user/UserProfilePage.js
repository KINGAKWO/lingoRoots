import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import MainLayout from '../../layouts/MainLayout';
import toast from 'react-hot-toast';
import './UserProfilePage.css'; // We will create this file next

// Placeholder for a chart component or library if we decide to use one
// import { Bar } from 'react-chartjs-2'; 
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserProfilePage = () => {
  const { currentUser } = useContext(AuthContext);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    completedLessons: 0,
    totalQuizzes: 0,
    averageQuizScore: 0,
    lastActivityDate: null,
  });

  useEffect(() => {
    if (!currentUser) {
      // Optional: Redirect to sign-in if not logged in, though ProtectedRoute should handle this
      // navigate('/signin'); 
      setLoading(false);
      return;
    }

    const fetchUserProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const progressColRef = collection(db, 'users', currentUser.uid, 'userProgress');
        const q = query(progressColRef, orderBy('lastAttemptedAt', 'desc')); // Get most recent activity first
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No progress data found.');
          setLoading(false);
          return;
        }

        const progressData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserProgress(progressData);
        calculateSummaryStats(progressData);

      } catch (err) {
        console.error('Error fetching user progress:', err);
        setError(`Failed to load user progress: ${err.message}`);
        toast.error(`Failed to load user progress: ${err.message}`);
      }
      setLoading(false);
    };

    fetchUserProgress();
  }, [currentUser]);

  const calculateSummaryStats = (progressData) => {
    let completedLessons = 0;
    let totalQuizScore = 0;
    let quizzesTaken = 0;
    let lastActivityTimestamp = null;

    progressData.forEach(item => {
      if (item.type === 'lesson' && item.status === 'completed') {
        completedLessons++;
      }
      if (item.type === 'quiz' && typeof item.score === 'number' && typeof item.total === 'number') {
        totalQuizScore += (item.score / item.total) * 100; // Store as percentage
        quizzesTaken++;
      }
      if (item.type === 'flashcards' && typeof item.score === 'number' && typeof item.total === 'number') {
        // Could also track flashcard performance if desired
      }

      // Track the latest activity date
      const activityDate = item.lastAttemptedAt?.toDate() || item.completedAt?.toDate();
      if (activityDate && (!lastActivityTimestamp || activityDate > lastActivityTimestamp)) {
        lastActivityTimestamp = activityDate;
      }
    });

    setSummaryStats({
      completedLessons,
      totalQuizzes: quizzesTaken,
      averageQuizScore: quizzesTaken > 0 ? (totalQuizScore / quizzesTaken) : 0,
      lastActivityDate: lastActivityTimestamp ? lastActivityTimestamp.toLocaleDateString() : 'N/A',
    });
  };

  if (loading) {
    return <MainLayout><div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading profile...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="p-6 text-center text-red-500">Error: {error}</div></MainLayout>;
  }

  // Placeholder for chart data and options if using Chart.js
  // const quizChartData = { ... };
  // const chartOptions = { ... };

  return (
    <MainLayout>
      <div className="user-profile-container container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-marine-blue dark:text-sky-300">Your Profile</h1>
          {currentUser && <p className="text-gray-600 dark:text-gray-400">{currentUser.email}</p>}
        </header>

        {/* Summary Stats Section */} 
        <section className="summary-stats-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="stat-card bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">Completed Lessons</h3>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{summaryStats.completedLessons}</p>
          </div>
          <div className="stat-card bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">Quizzes Taken</h3>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{summaryStats.totalQuizzes}</p>
          </div>
          <div className="stat-card bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">Avg. Quiz Score</h3>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{summaryStats.averageQuizScore.toFixed(1)}%</p>
          </div>
          <div className="stat-card bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">Last Active</h3>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{summaryStats.lastActivityDate}</p>
          </div>
        </section>

        {/* Detailed Progress Section - Quizzes */} 
        <section className="detailed-progress-section mb-8">
          <h2 className="text-2xl font-semibold text-marine-blue dark:text-sky-400 mb-4">Quiz Performance</h2>
          {userProgress.filter(item => item.type === 'quiz').length > 0 ? (
            <div className="space-y-4">
              {userProgress.filter(item => item.type === 'quiz').map(quiz => (
                <div key={quiz.id} className="quiz-item bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{quiz.title || quiz.id.replace('_quiz','').replace(/_/g, ' ')}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                      {quiz.lastAttemptedAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-700 dark:text-gray-300">Score: {quiz.score} / {quiz.total}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-sky-500 h-2.5 rounded-full"
                        style={{ width: `${(quiz.score / quiz.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No quiz data available yet. Take some quizzes to see your performance!</p>
          )}
        </section>

        {/* Placeholder for Chart - if using Chart.js or similar */}
        {/* {userProgress.filter(item => item.type === 'quiz').length > 0 && (
          <section className="chart-section bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-marine-blue dark:text-sky-400 mb-4">Quiz Score Distribution (Example)</h2>
            <div style={{ height: '300px' }}> {/* Adjust height as needed */}
        {/* <Bar data={quizChartData} options={chartOptions} /> */}
        {/*    </div>
          </section>
        )} */}

      </div>
    </MainLayout>
  );
};

export default UserProfilePage;