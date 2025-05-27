import React from 'react';
import './QuestionComponent.css';

const QuestionComponent = ({ question, onAnswer, selectedAnswer }) => {
  if (!question) {
    return <div className="p-4 text-center text-gray-500">Loading question...</div>;
  }

  const handleOptionClick = (option) => {
    if (onAnswer) {
      onAnswer(question.id, option);
    }
  };

  return (
    <div className="question-container bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-marine-blue dark:text-sky-400 mb-4">{question.text}</h3>
      <div className="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`option-button p-3 border rounded-md text-left transition-colors 
                        ${selectedAnswer === option 
                          ? 'bg-sky-500 text-white border-sky-500 dark:bg-sky-600 dark:border-sky-600'
                          : 'bg-gray-100 hover:bg-sky-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'}
                        `}
            // disabled={selectedAnswer !== null} // Optional: disable after an answer is selected for the current question
          >
            {option}
          </button>
        ))}
      </div>
      {question.image && (
        <div className="mt-4">
          <img src={question.image} alt="Question illustration" className="max-w-full h-auto rounded-md shadow-sm" />
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;