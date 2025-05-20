import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, setDoc, getDoc, serverTimestamp, increment } from "firebase/firestore";

const Quiz = ({ lessonId, languageId, userId, onQuizComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]); // To store user's answers
  const [quizStatus, setQuizStatus] = useState('active'); // 'active', 'completed', 'reviewing'

  useEffect(() => {
    // Reset state when lessonId or languageId changes (e.g., new quiz starts)
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowFeedback(false);
    setFeedbackMessage('');
    setLoading(true);
    setError(null);
    setUserAnswers([]);
    setQuizStatus('active');

    const fetchQuestions = async () => {
      if (!lessonId || !languageId) {
        setLoading(false); // Ensure loading is set to false if we return early
        return;
      }
      // setLoading(true); // Already set above
      // setError(null); // Already set above
      // setQuestions([]); // Already set above

      try {
        const quizPath = `languages/${languageId}/quizQuestions`;
        const qQuery = query(
          collection(db, quizPath),
          where("lessonId", "==", lessonId),
          orderBy("order") // Assuming you have an 'order' field
        );
        const querySnapshot = await getDocs(qQuery);
        const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (fetchedQuestions.length === 0) {
          setError("No quiz questions found for this lesson.");
        } else {
          setQuestions(fetchedQuestions);
        }
      } catch (err) {
        console.error("Error fetching quiz questions:", err);
        setError("Failed to load quiz questions. " + err.message);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [lessonId, languageId]);

  const handleAnswerSelect = (option) => {
    if (showFeedback || quizStatus !== 'active') return; 
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      setFeedbackMessage("Please select an answer.");
      setShowFeedback(true);
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedbackMessage("Correct!");
    } else {
      setFeedbackMessage(`Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`);
    }
    
    setUserAnswers(prevAnswers => [
      ...prevAnswers,
      {
        questionId: currentQuestion.id, // Store question id for reference if needed
        questionText: currentQuestion.questionText,
        options: currentQuestion.options,
        selectedAnswer: selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect
      }
    ]);
    setShowFeedback(true);
  };

  const saveQuizResult = async (finalScore, totalQuestions) => {
    if (!userId || !lessonId) {
      console.error("User ID or Lesson ID is missing, cannot save quiz result.");
      return;
    }
    const userProgressDocRef = doc(db, "userProgress", userId);
    try {
        const userProgressSnap = await getDoc(userProgressDocRef);
        let existingHighScore = 0;
        if (userProgressSnap.exists() && userProgressSnap.data().lessonScores && userProgressSnap.data().lessonScores[lessonId]) {
          existingHighScore = userProgressSnap.data().lessonScores[lessonId].highScore || 0;
        }
        const newHighScore = Math.max(existingHighScore, finalScore);

        await setDoc(userProgressDocRef, {
          lessonScores: {
            [lessonId]: {
              lastScore: finalScore,
              highScore: newHighScore,
              totalQuestions: totalQuestions,
              attempts: increment(1), 
              lastAttemptedOn: serverTimestamp()
            }
          }
        }, { merge: true }); 
        console.log("Quiz result saved for lesson:", lessonId, "for user:", userId);
    } catch (error) {
      console.error("Error saving quiz result: ", error);
    }
  };

  const handleNextQuestion = async () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setFeedbackMessage('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      await saveQuizResult(score, questions.length); 
      setQuizStatus('completed');
    }
  };

  const handleStartReview = () => {
    setQuizStatus('reviewing');
    setCurrentQuestionIndex(0); // Reset to first question for review
  };

  const handleExitReviewOrFinish = () => {
    if (onQuizComplete) {
      onQuizComplete(score, questions.length); // Pass the final score
    }
    // Resetting component state here might be desired if the component isn't unmounted
    // For now, we assume onQuizComplete leads to a state change in the parent that handles this.
    // Example reset if needed:
    // setQuizStatus('active');
    // setCurrentQuestionIndex(0);
    // setUserAnswers([]);
    // setScore(0);
    // setSelectedAnswer(null);
  };
  
  const handleReviewNavigation = (direction) => {
    if (direction === 'next' && currentQuestionIndex < userAnswers.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  
  // This condition should ideally be checked after loading and error,
  // and before trying to access questions[currentQuestionIndex]
  if (quizStatus === 'active' && questions.length === 0) {
    return <p>No quiz questions available for this lesson yet.</p>;
  }


  // UI for 'active' quiz state
  if (quizStatus === 'active') {
    // Ensure currentQuestion is available before trying to render
    if (questions.length === 0 || !questions[currentQuestionIndex]) {
        // This case should be rare if the above check is effective, but good for safety
        return <p>Loading question data or no questions found...</p>; 
    }
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div>
        <h4>Quiz: Question {currentQuestionIndex + 1} of {questions.length}</h4>
        <p>{currentQuestion.questionText}</p>
        <div>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showFeedback}
              style={{ 
                margin: '5px', 
                padding: '10px',
                border: '1px solid #ccc',
                backgroundColor: selectedAnswer === option ? 'lightblue' : (showFeedback && option === currentQuestion.correctAnswer ? 'lightgreen' : 'white'),
                borderColor: showFeedback && option === selectedAnswer ? (selectedAnswer === currentQuestion.correctAnswer ? 'green' : 'red') : '#ccc',
                fontWeight: selectedAnswer === option ? 'bold' : 'normal'
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {showFeedback ? (
          <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #eee' }}>
            <p style={{ fontWeight: 'bold' }}>{feedbackMessage}</p>
            <button onClick={handleNextQuestion} style={{ marginTop: '10px' }}>
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </button>
          </div>
        ) : (
          <button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} style={{ marginTop: '20px', padding: '10px 15px' }}>
            Submit Answer
          </button>
        )}
        <p style={{ marginTop: '20px' }}>Score: {score} / {questions.length}</p>
      </div>
    );
  }

  // UI for 'completed' quiz state (showing score and review option)
  if (quizStatus === 'completed') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h4>Quiz Finished!</h4>
        <p style={{ fontSize: '1.2em' }}>Your final score: {score} out of {questions.length}</p>
        <button onClick={handleStartReview} style={{ marginRight: '10px', padding: '10px 15px' }}>Review Answers</button>
        <button onClick={handleExitReviewOrFinish} style={{ padding: '10px 15px' }}>Finish & Back to Lessons</button>
      </div>
    );
  }

  // UI for 'reviewing' quiz state
  if (quizStatus === 'reviewing') {
    if (userAnswers.length === 0 || !userAnswers[currentQuestionIndex]) {
        return <p>No answers to review or error loading review data.</p>;
    }
    const reviewItem = userAnswers[currentQuestionIndex];
    return (
      <div style={{ padding: '20px' }}>
        <h4>Reviewing Question {currentQuestionIndex + 1} of {userAnswers.length}</h4>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>{reviewItem.questionText}</p>
        <div>
          {reviewItem.options.map((option, index) => {
            let style = { 
                margin: '5px', 
                padding: '10px',
                border: '1px solid #ccc',
                display: 'block', // Make buttons take full width for better readability
                width: '100%',
                textAlign: 'left'
            };
            if (option === reviewItem.correctAnswer) {
              style.backgroundColor = 'lightgreen'; 
              style.borderColor = 'green';
            }
            if (option === reviewItem.selectedAnswer) {
              style.fontWeight = 'bold';
              style.borderColor = reviewItem.isCorrect ? 'blue' : 'red'; 
              if (option !== reviewItem.correctAnswer) {
                 style.backgroundColor = '#ffcccb'; // Light red for incorrect user selection
              }
            }
            return (
              <button key={index} disabled style={style}>
                {option}
                {option === reviewItem.selectedAnswer && (reviewItem.isCorrect ? " (Your answer - Correct)" : " (Your answer - Incorrect)")}
                {option === reviewItem.correctAnswer && option !== reviewItem.selectedAnswer && " (Correct answer)"}
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: '15px' }}>
          Your answer was: <span style={{ fontWeight: 'bold', color: reviewItem.isCorrect ? 'green' : 'red' }}>{reviewItem.selectedAnswer}</span>.
          {reviewItem.isCorrect ? " Well done!" : ` The correct answer was: ${reviewItem.correctAnswer}.`}
        </p>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => handleReviewNavigation('prev')} disabled={currentQuestionIndex === 0} style={{ padding: '10px 15px' }}>
            Previous
          </button>
          <button onClick={handleExitReviewOrFinish} style={{ padding: '10px 15px' }}>
            Exit Review
          </button>
          <button onClick={() => handleReviewNavigation('next')} disabled={currentQuestionIndex === userAnswers.length - 1} style={{ padding: '10px 15px' }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  return null; // Should ideally not be reached
};

export default Quiz;