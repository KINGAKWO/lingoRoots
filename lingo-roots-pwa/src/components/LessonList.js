import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
// VocabularyList and Quiz are now part of LessonPage
// import VocabularyList from './VocabularyList'; 
// import Quiz from './Quiz'; 
import { db } from '../services/firebase'; 
import { doc, getDoc } from "firebase/firestore"; 


const LessonList = ({ lessons , userId, languageId }) => { // Added languageId prop
  const navigate = useNavigate(); // Initialize useNavigate
  // selectedLesson, showQuiz, quizResult are no longer needed here as LessonPage handles this
  // const [selectedLesson, setSelectedLesson] = useState(null);
  // const [showQuiz, setShowQuiz] = useState(false); 
  // const [quizResult, setQuizResult] = useState(null); 
  const [userProgress, setUserProgress] = useState(null); 
  const [loadingProgress, setLoadingProgress] = useState(false); 

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!userId) {
        setUserProgress(null); 
        return;
      }
      setLoadingProgress(true);
      try {
        const userProgressRef = doc(db, "userProgress", userId);
        const docSnap = await getDoc(userProgressRef);
        if (docSnap.exists()) {
          setUserProgress(docSnap.data());
        } else {
          setUserProgress(null); 
          console.log("No user progress found for user:", userId);
        }
      } catch (error) {
        console.error("Error fetching user progress:", error);
        setUserProgress(null); 
      }
      setLoadingProgress(false);
    };

    fetchUserProgress();
  }, [userId]);


  if (!lessons || lessons.length === 0) {
    return <p>No lessons available for this language yet.</p>;
  }

  const handleLessonClick = (lesson) => {
    // Navigate to the LessonPage with language and lesson ID
    // Ensure 'languageId' prop is passed to LessonList from its parent (LanguageDashboard.js likely)
    if (languageId && lesson.id) {
      navigate(`/lessons/${languageId}/${lesson.id}`);
    } else {
      console.error('Language ID or Lesson ID is missing for navigation.');
      // Optionally, show a toast or alert to the user
    }
  };
  // handleStartQuiz and handleQuizComplete are no longer needed here
  
  return (
    <div>
      <h3>Available Lessons:</h3>
      {loadingProgress && <p>Loading progress...</p>}
      <ul>
        {lessons.map(lesson => {
          const progress = userProgress?.lessonScores?.[lesson.id];
          let progressDisplay = "";
          if (progress) {
            progressDisplay = ` (High Score: ${progress.highScore}/${progress.totalQuestions})`;
            // Example completion logic:
            // if (progress.highScore >= progress.totalQuestions * 0.8) {
            //   progressDisplay += " - Completed!";
            // }
          }
          return (
            <li key={lesson.id} onClick={() => handleLessonClick(lesson)} style={{ cursor: 'pointer' }}>
              {lesson.order}. {lesson.title} ({lesson.type})
              {progressDisplay}
            </li>
          );
        })}
      </ul>
      {/* The content below (selected lesson details, quiz) is now handled by LessonPage.js */}
      {/* <hr /> */}
      {/* ... removed selected lesson display and quiz logic ... */}
    </div>
  );
};

export default LessonList;