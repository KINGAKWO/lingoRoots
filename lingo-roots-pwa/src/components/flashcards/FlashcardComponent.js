import React, { useState } from 'react';
import './FlashcardComponent.css';

const FlashcardComponent = ({ card, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!card) {
    return <div className="p-4 text-center text-gray-500">Loading card...</div>;
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) {
      onFlip(card.id);
    }
  };

  return (
    <div 
      className={`flashcard-container bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 cursor-pointer perspective ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleFlip()}
      aria-pressed={isFlipped}
      aria-label={`Flashcard: ${isFlipped ? card.back : card.front}. Click to flip.`}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front flex flex-col items-center justify-center">
          <p className="text-2xl sm:text-3xl font-semibold text-marine-blue dark:text-sky-300 text-center">{card.front}</p>
          {card.frontExample && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center"><em>{card.frontExample}</em></p>}
        </div>
        <div className="flashcard-back flex flex-col items-center justify-center">
          <p className="text-2xl sm:text-3xl font-semibold text-sky-700 dark:text-sky-400 text-center">{card.back}</p>
          {card.backExample && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center"><em>{card.backExample}</em></p>}
        </div>
      </div>
    </div>
  );
};

export default FlashcardComponent;