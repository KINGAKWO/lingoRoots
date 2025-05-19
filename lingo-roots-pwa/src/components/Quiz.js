import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const Quiz = ({ lessonId, languageId, onQuizComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!lessonId || !languageId) return;
      setLoading(true);
      setError(null);
      setQuestions([]);

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
    if (showFeedback) return; // Don't allow changing answer after feedback
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      setFeedbackMessage("Please select an answer.");
      setShowFeedback(true);
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prevScore => prevScore + 1);
      setFeedbackMessage("Correct!");
    } else {
      setFeedbackMessage(`Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setFeedbackMessage('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Quiz finished
      if (onQuizComplete) {
        onQuizComplete(score, questions.length);
      }
    }
  };

  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (questions.length === 0) return <p>No quiz questions available for this lesson yet.</p>;

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
              backgroundColor: selectedAnswer === option ? 'lightblue' : 'white' 
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {showFeedback ? (
        <div>
          <p>{feedbackMessage}</p>
          <button onClick={handleNextQuestion}>
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </button>
        </div>
      ) : (
        <button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} style={{ marginTop: '10px' }}>
          Submit Answer
        </button>
      )}
      <p>Score: {score} / {questions.length}</p>
    </div>
  );
};

export default Quiz;