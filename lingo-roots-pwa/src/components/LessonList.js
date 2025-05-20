import React, { useState, useEffect } from 'react';
import VocabularyList from './VocabularyList'; 
import Quiz from './Quiz'; 
import { db } from '../firebase'; 
import { doc, getDoc } from "firebase/firestore"; 


const LessonList = ({ lessons , userId }) => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false); 
  const [quizResult, setQuizResult] = useState(null); 
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
    setSelectedLesson(lesson);
    setShowQuiz(false); 
    setQuizResult(null); 
  };
  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizResult(null); 
  };

  const handleQuizComplete = (finalScore, totalQuestions) => {
    setQuizResult({ score: finalScore, total: totalQuestions });
    setShowQuiz(false); 
    // Optionally, re-fetch user progress here to update the list immediately
    // if you want to see the score update without a page refresh or userId change.
    // For now, it will update when userId changes or on next mount.
  };
  
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
      <hr />
      
      {selectedLesson && !showQuiz && !quizResult && (
        <div>
          <h4>Selected Lesson: {selectedLesson.title}</h4>
          <p>{selectedLesson.content}</p>
          {selectedLesson.type === 'vocabulary' && (
            <VocabularyList lessonId={selectedLesson.id} languageId={selectedLesson.languageId} />
          )}
          {/* Add more conditions here for other lesson types like grammar, quizzes etc. */}
          <button onClick={handleStartQuiz} style={{ marginTop: '10px', marginBottom: '10px' }}>
            Start Quiz for this Lesson
          </button>
        </div>
      )}

      {selectedLesson && showQuiz && (
        <Quiz 
          lessonId={selectedLesson.id} 
          languageId={selectedLesson.languageId}
          userId={userId}
          onQuizComplete={handleQuizComplete} 
        />
      )}

      {quizResult && (
        <div>
          <h4>Quiz Finished!</h4>
          <p>Your score: {quizResult.score} out of {quizResult.total}</p>
          <button onClick={() => { setSelectedLesson(null); setQuizResult(null); }}>Back to Lessons</button>
        </div>
      )}
    </div>
  );
};

export default LessonList;