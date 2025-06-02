import React from 'react';

const QuizQuestion = ({ question }) => {
  return (
    <div className="mb-4">
      <p className="font-semibold">{question.text}</p>
      {/* Render options and handle selection */}
      
    </div>
  );
};

export default QuizQuestion;
