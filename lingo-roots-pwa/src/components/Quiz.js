import React from 'react';
import './Quiz.css'; // We'll create this CSS file for styling

const Quiz = ({ questions, userAnswers, onAnswerSelect, title }) => {
  if (!questions || questions.length === 0) {
    return <p className="quiz-status">No questions for this practice session.</p>;
  }

  const handleOptionChange = (questionId, optionValue) => {
    onAnswerSelect(questionId, optionValue);
  };

  return (
    <div className="quiz-container">
      {title && <h3 className="quiz-title">{title}</h3>}
      {questions.map((question, index) => (
        <div key={question.id || `q-${index}`} className="quiz-question-block">
          <p className="quiz-question-text">{question.questionText}</p> {/* Removed index number to match image more closely */}
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => (
              <label key={optionIndex} className="quiz-option-label">
                <input
                  type="radio"
                  name={`question-${question.id || index}`}
                  value={option}
                  checked={userAnswers[question.id] === option}
                  onChange={() => handleOptionChange(question.id, option)}
                  className="quiz-option-radio"
                />
                <span className="quiz-option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Quiz;