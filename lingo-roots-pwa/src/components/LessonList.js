import React, { useState } from 'react';
import VocabularyList from './VocabularyList'; // We'll create this next
import Quiz from './Quiz'; // Import the Quiz component

const LessonList = ({ lessons }) => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false); // State to toggle quiz visibility
  const [quizResult, setQuizResult] = useState(null); // State to store quiz result

  if (!lessons || lessons.length === 0) {
    return <p>No lessons available for this language yet.</p>;
  }

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setShowQuiz(false); // Reset quiz view when a new lesson is clicked
    setQuizResult(null); // Reset quiz result
  };
  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizResult(null); // Reset quiz result before starting
  };

  const handleQuizComplete = (finalScore, totalQuestions) => {
    setQuizResult({ score: finalScore, total: totalQuestions });
    setShowQuiz(false); // Hide quiz and show result

  };

  return (
    <div>
      <h3>Available Lessons:</h3>
      <ul>
        {lessons.map(lesson => (
          <li key={lesson.id} onClick={() => handleLessonClick(lesson)} style={{ cursor: 'pointer' }}>
            {lesson.order}. {lesson.title} ({lesson.type})
          </li>
        ))}
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