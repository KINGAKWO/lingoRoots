import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Import the CSS file

const Dashboard = ({ userId }) => {
  const [userData, setUserData] = useState({ firstName: '', lastName: '' });
  const [userProgressData, setUserProgressData] = useState(null);
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('User ID is not available.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch user details (name)
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const { firstName, lastName } = userDocSnap.data();
          setUserData({ firstName: firstName || '', lastName: lastName || '' });
        } else {
          console.log("No user document found for name, using defaults.");
          setUserData({ firstName: 'Demo', lastName: 'User' }); // Default if no user doc
        }

        // Fetch user progress
        const progressDocRef = doc(db, "userProgress", userId);
        const progressDocSnap = await getDoc(progressDocRef);
        if (progressDocSnap.exists()) {
          const progressData = progressDocSnap.data();
          setUserProgressData(progressData);
          // Set initial selected language
          if (progressData.languagesProgress && progressData.languagesProgress.length > 0) {
            setSelectedLanguageId(progressData.languagesProgress[0].id);
          }
        } else {
          console.log("No user progress found, initializing with mock data for UI.");
          // Fallback to mock data if no progress found, for UI development
          const mockProgress = {
            stats: {
              totalLanguages: 2,
              currentStreak: 5, 
              timeSpent: "12.5 hours",
              averageScore: 87
            },
            languagesProgress: [
              {
                id: "ghomala",
                name: "Ghomala",
                completedLessons: 7,
                totalLessons: 20,
                overallProgress: 35,
                nextLesson: {
                  title: "Basic Greetings",
                  description: "Continue your learning journey with the next lesson in your curriculum."
                },
                recentActivity: [
                  { id: "1", description: "Completed Lesson: Numbers 1-10", date: "2023-05-19", score: "85%" },
                  { id: "2", description: "Vocabulary Practice", date: "2023-05-18", score: "92%" }
                ]
              },
              {
                id: "ewondo",
                name: "Ewondo",
                completedLessons: 3,
                totalLessons: 15,
                overallProgress: 20,
                nextLesson: {
                  title: "Ewondo Alphabets",
                  description: "Learn the basic alphabets in Ewondo."
                },
                recentActivity: [
                  { id: "3", description: "Completed Lesson: Greetings", date: "2023-05-20", score: "90%" },
                ]
              }
            ]
          };
          setUserProgressData(mockProgress);
          if (mockProgress.languagesProgress && mockProgress.languagesProgress.length > 0) {
            setSelectedLanguageId(mockProgress.languagesProgress[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. " + err.message);
        setUserProgressData(null); // Clear data on error
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  if (loading) return <div class="loading-container"><p>Loading dashboard...</p></div>;
  if (error) return <div class="error-container"><p>Error: {error}</p></div>;

  // Handle the case where userProgressData is null or languagesProgress is empty
  if (!userProgressData || !userProgressData.languagesProgress || userProgressData.languagesProgress.length === 0) {
    const displayName = userData.firstName ? `${userData.firstName}` : 'Learner';

    return (
      <div className="dashboard-page-container">
        <div className="dashboard-header-greeting">
          <h2>Welcome, {displayName}!</h2>
          <p>Your language learning adventure starts here.</p>
        </div>
        <div className="dashboard-empty-state">
          {/* Optional: <img src="/path/to/illustration.svg" alt="Start learning" className="empty-state-icon" /> */}
          <h3>It's Time to Learn Something New!</h3>
          <p>
            You haven't started any language lessons yet.
            Explore our available languages and begin your first lesson today.
          </p>
          <Link to="/lessons" className="dashboard-button button-green empty-state-cta">
            Explore Lessons & Start Your First One
          </Link>
        </div>
      </div>
    );
  }

  const { stats, languagesProgress } = userProgressData;
  const selectedLanguageData = languagesProgress.find(lang => lang.id === selectedLanguageId);
  const userName = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : (userData.firstName || userData.lastName || 'Demo User');

  return (
    <div className="dashboard-page-container"> {/* Updated class name for consistency */}
      <div className="dashboard-header-greeting">
        <h2>Welcome back, {userData.firstName || 'User'}</h2>
        <p>Track your progress and continue your language learning journey.</p>
      </div>

      <div className="summary-stats-cards">
        <div className="stat-card">
          <div className="stat-icon">TL</div> {/* Placeholder for icon */}
          <div className="stat-value">{stats?.totalLanguages || 0}</div>
          <div className="stat-label">Total Languages</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">CS</div> {/* Placeholder for icon */}
          <div className="stat-value">{stats?.currentStreak || 0} days</div>
          <div className="stat-label">Current Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">TS</div> {/* Placeholder for icon */}
          <div className="stat-value">{stats?.timeSpent || '0 hours'}</div>
          <div className="stat-label">Time Spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">AS</div> {/* Placeholder for icon */}
          <div className="stat-value">{stats?.averageScore || 0}%</div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>

      <div className="language-tabs">
        {languagesProgress.map(lang => (
          <button 
            key={lang.id} 
            className={`language-tab-btn ${selectedLanguageId === lang.id ? 'active' : ''}`}
            onClick={() => setSelectedLanguageId(lang.id)}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {selectedLanguageData && (
        <>
          <div className="language-progress-details">
            <h3>{selectedLanguageData.name} Progress</h3>
            <p>You've completed {selectedLanguageData.completedLessons} out of {selectedLanguageData.totalLessons} lessons</p>
            <div className="overall-progress-bar-container">
              <div className="overall-progress-bar" style={{ width: `${selectedLanguageData.overallProgress}%` }}></div>
              <span>{selectedLanguageData.overallProgress}%</span>
            </div>
            <h4>Next Lesson: {selectedLanguageData.nextLesson.title}</h4>
            <p>{selectedLanguageData.nextLesson.description}</p>
            {/* Assuming /lessons/:languageId/:lessonId or similar structure */}
            <Link to={`/lessons/${selectedLanguageData.id}`} className="start-lesson-btn">
                Start Lesson
            </Link>
          </div>

          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <p>Your learning activity for the past 7 days</p>
            {selectedLanguageData.recentActivity && selectedLanguageData.recentActivity.length > 0 ? (
              <ul>
                {selectedLanguageData.recentActivity.map(activity => (
                  <li key={activity.id} className="activity-item">
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-meta">
                      <span className="activity-date">{activity.date}</span>
                      {activity.score && <span className="activity-score">{activity.score}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity for {selectedLanguageData.name}.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;