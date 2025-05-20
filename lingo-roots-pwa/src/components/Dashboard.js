import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Import the CSS file

const Dashboard = ({ userId }) => {
  const [userProgressData, setUserProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!userId) {
        setLoading(false);
        setError('User ID is not available.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const userProgressRef = doc(db, "userProgress", userId);
        const docSnap = await getDoc(userProgressRef);
        if (docSnap.exists()) {
          setUserProgressData(docSnap.data());
        } else {
          // Initialize with default structure if no progress found
          setUserProgressData({
            overallPercentage: 0,
            lastLesson: 'No lessons completed yet',
            dailyQuizCompleted: false,
            dailyStreak: 0,
            points: 0,
            badgesEarned: 0,
            // Ensure all expected fields have defaults
            lessonScores: {}, 
            completedLessons: [],
            // Add any other fields that your dashboard might expect from userProgress
          });
          console.log("No user progress found for user:", userId, ". Initializing with defaults.");
        }
      } catch (err) {
        console.error("Error fetching user progress:", err);
        setError("Failed to load user progress. " + err.message);
        setUserProgressData(null); // Clear data on error
      }
      setLoading(false);
    };

    fetchUserProgress();
  }, [userId]);

  // Default structure for userProgress if still null after loading (e.g., error or no data)
  const userProgress = userProgressData || {
    overallPercentage: 0,
    lastLesson: 'Loading...',
    dailyQuizCompleted: false,
    dailyStreak: 0,
    points: 0,
    badgesEarned: 0,
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  // if (!userProgressData) return <p>No progress data available. Start a lesson to see your progress!</p>; // Optional: specific message if data is null after loading without error

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome Back!</h1>
        <p>Let's continue your language learning journey.</p>
      </header>

      {/* Continue Learning Section */}
      <section className="dashboard-section continue-learning-section">
        <h2>Continue Learning</h2>
        <p>Your last lesson: <strong>{userProgress.lastLesson}</strong></p>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${userProgress.overallPercentage}%` }}
          >
            {userProgress.overallPercentage}%
          </div>
        </div>
        <Link to="/lessons" className="dashboard-button button-green">
          Resume Lesson
        </Link>
      </section>

      {/* Daily Quiz Section */}
      <section className="dashboard-section daily-quiz-section">
        <h2>Daily Quiz</h2>
        {userProgress.dailyQuizCompleted ? (
          <p>You've completed today's quiz. Great job!</p>
        ) : (
          <p>Test your knowledge with a quick daily quiz!</p>
        )}
        <Link 
          to="/lessons" /* Assuming quiz is part of lessons for now */ 
          className={`dashboard-button button-red ${userProgress.dailyQuizCompleted ? 'disabled' : ''}`}
          aria-disabled={userProgress.dailyQuizCompleted}
        >
          {userProgress.dailyQuizCompleted ? 'View Results' : 'Start Daily Quiz'}
        </Link>
      </section>

      {/* Gamification: Streaks, Points, Badges */}
      <section className="dashboard-section gamification-elements-section">
        <h2>Your Achievements</h2>
        <div className="gamification-grid">
          <div className="gamification-item streak-item">
            <h3>🔥 Streaks</h3>
            <p>{userProgress.dailyStreak} Days</p>
          </div>
          <div className="gamification-item points-item">
            <h3>⭐ Points</h3>
            <p>{userProgress.points}</p>
          </div>
          <div className="gamification-item badges-item">
            <h3>🏆 Badges</h3>
            <p>{userProgress.badgesEarned} Earned</p>
          </div>
        </div>
      </section>

      {/* Cultural Corner Section - Placeholder */}
      <section className="dashboard-section cultural-corner-section">
        <h2>Cultural Corner</h2>
        <p>Discover interesting facts and cultural insights related to your chosen languages.</p>
        {/* Link to a future /culture page */}
        <Link to="/lessons" className="dashboard-button button-yellow">
          Explore Culture
        </Link>
      </section>

      <footer className="dashboard-footer">
        <p>Keep up the great work! Consistency is key to language mastery.</p>
      </footer>
    </div>
  );
};

export default Dashboard;