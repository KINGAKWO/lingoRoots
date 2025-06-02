import React, { useEffect, useState } from 'react';
import Flashcard from '../components/Flashcard';
import { fetchFlashcards } from '../services/flashcardService';

const FlashcardTrainerPage = ({ lessonId }) => {
  const [flashcards, setFlashcards] = useState([]);

  useEffect(() => {
    fetchFlashcards(lessonId).then(setFlashcards);
  }, [lessonId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
      {flashcards.map((card, index) => (
        <Flashcard key={index} card={card} />
      ))}
    </div>
  );
};

export default FlashcardTrainerPage;
