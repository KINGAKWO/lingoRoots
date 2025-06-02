import React, { useEffect, useState } from 'react';
import QuizQuestion from '../components/QuizQuestion';
import { fetchQuiz } from '../services/quizService';

const QuizPage = ({ lessonId }) => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchQuiz(lessonId).then(setQuestions);
  }, [lessonId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz</h1>
      {questions.map((q, index) => (
        <QuizQuestion key={index} question={q} />
      ))}
    </div>
  );
};

export default QuizPage;
