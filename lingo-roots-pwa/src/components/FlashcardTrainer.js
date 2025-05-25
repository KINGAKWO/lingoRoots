import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Assuming firebase is initialized in services
import { collection, getDocs, query, where } from 'firebase/firestore';
import './FlashcardTrainer.css'; // We'll create this for additional styling if needed

// Helper function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

const FlashcardTrainer = ({ moduleId, languageId, onSessionComplete }) => {
  const [vocabulary, setVocabulary] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(''); // 'correct', 'incorrect', or ''
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionProgress, setSessionProgress] = useState([]); // [{ wordId: '...', status: 'correct'/'incorrect' }]

  useEffect(() => {
    const fetchVocabulary = async () => {
      setIsLoading(true);
      setError(null);
      if (!languageId || !moduleId) {
        setError('Language ID and Module ID are required.');
        setIsLoading(false);
        return;
      }
      try {
        // Assuming 'vocabulary' collection stores words with 'languageId' and 'moduleId' fields
        // And each vocab item has 'nativeWord', 'translation', 'audioUrl'
        // And 'otherTranslations' as an array of strings for distractors
        const q = query(
          collection(db, 'languages', languageId, 'modules', moduleId, 'vocabulary'),
          // Add any other specific queries if needed, e.g., where('difficulty', '==', 'beginner')
        );
        const querySnapshot = await getDocs(q);
        const vocabList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (vocabList.length === 0) {
          setError('No vocabulary found for this module.');
          setVocabulary([]);
        } else {
          setVocabulary(shuffleArray(vocabList)); // Shuffle for variety
        }
      } catch (err) {
        console.error('Error fetching vocabulary:', err);
        setError('Failed to load vocabulary. Please try again.');
      }
      setIsLoading(false);
    };

    fetchVocabulary();
  }, [moduleId, languageId]);

  useEffect(() => {
    if (vocabulary.length > 0 && currentCardIndex < vocabulary.length) {
      const card = vocabulary[currentCardIndex];
      setCurrentCard(card);
      // Prepare multiple-choice options
      // One correct answer + 2-3 distractors
      // Distractors can come from the card itself or other cards in the list
      let distractors = card.distractors || []; // Assuming 'distractors' field in vocab item
      if (distractors.length < 3) {
        // If not enough distractors, pick from other words' translations
        const otherWords = vocabulary.filter(v => v.id !== card.id);
        const potentialDistractors = shuffleArray(otherWords.map(w => w.translation)).slice(0, 3 - distractors.length);
        distractors = [...distractors, ...potentialDistractors];
      }
      // Ensure we have exactly 3 or 4 options in total
      const choices = shuffleArray([card.translation, ...distractors.slice(0, Math.min(2, distractors.length))]); 
      // Ensure we have 3 to 4 options, including the correct one
      if (choices.length < 3 && vocabulary.length > 1) {
        // Add more distractors if possible
        const moreDistractors = vocabulary
          .filter(v => v.id !== card.id && !choices.includes(v.translation))
          .map(v => v.translation);
        choices.push(...shuffleArray(moreDistractors).slice(0, 3 - choices.length));
      }
      setOptions(choices.slice(0,4)); // Max 4 options
      setFeedback('');
    } else if (vocabulary.length > 0 && currentCardIndex >= vocabulary.length) {
      // Session ended
      if (onSessionComplete) {
        onSessionComplete({ score, total: vocabulary.length, progress: sessionProgress });
      }
    }
  }, [vocabulary, currentCardIndex, onSessionComplete]);

  const handleAnswer = (selectedOption) => {
    if (!currentCard) return;
    const isCorrect = selectedOption === currentCard.translation;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    setSessionProgress(prev => [...prev, { wordId: currentCard.id, word: currentCard.nativeWord, status: isCorrect ? 'correct' : 'incorrect' }]);

    // Optional: Add a slight delay before showing the next card to allow user to see feedback
    setTimeout(() => {
      setCurrentCardIndex(prevIndex => prevIndex + 1);
    }, 1500); // 1.5 second delay
  };

  const playAudio = () => {
    if (currentCard && currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl);
      audio.play().catch(e => console.error('Error playing audio:', e));
    }
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-center text-gray-500">Loading flashcards...</div>;
  }

  if (error) {
    return <div className="p-4 sm:p-6 text-center text-red-500 bg-red-100 border border-red-400 rounded-md">Error: {error}</div>;
  }

  if (!currentCard && vocabulary.length > 0 && currentCardIndex >= vocabulary.length) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg flex flex-col items-center space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-sky-700">Session Complete!</h2>
        <p className="text-base sm:text-lg text-gray-700">Your score: {score} / {vocabulary.length}</p>
        <button 
          onClick={() => { /* Reset or navigate away */ setCurrentCardIndex(0); setScore(0); setSessionProgress([]); setIsLoading(true); /* Refetch or restart */ }}
          className="mt-4 px-5 py-2.5 sm:px-6 sm:py-3 bg-marine-blue text-white font-semibold rounded-lg shadow-md hover:bg-marine-blue-dark focus:outline-none focus:ring-2 focus:ring-marine-blue focus:ring-opacity-75 transition duration-150 text-sm sm:text-base"
        >
          Restart Session
        </button>
        {/* Optionally display detailed progress here */}
      </div>
    );
  }
  
  if (!currentCard) {
     return <div className="p-4 sm:p-6 text-center text-gray-500">No flashcards available for this module.</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto bg-white rounded-xl shadow-lg flex flex-col items-center space-y-3 sm:space-y-4 font-sans">
      <div className="w-full text-right text-xs sm:text-sm text-gray-500">
        Card {currentCardIndex + 1} of {vocabulary.length}
      </div>
      {/* Card content area */}
      <div className={`w-full p-4 py-6 sm:p-6 rounded-lg text-center transition-all duration-300 ease-in-out 
                      ${feedback === 'correct' ? 'bg-green-100 border-green-500' : feedback === 'incorrect' ? 'bg-red-100 border-red-500' : 'bg-sky-100 border-sky-300'} border-2`}>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-marine-blue mb-2 sm:mb-3">{currentCard.nativeWord}</h3>
        {currentCard.audioUrl && (
          <button 
            onClick={playAudio} 
            className="mb-3 sm:mb-4 p-2 rounded-full hover:bg-sky-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 active:bg-sky-300"
            aria-label={`Play audio for ${currentCard.nativeWord}`}
          >
            {/* Increased tap target size slightly for the icon container */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.683 2.867 11 3.117 11 3.707V20.293c0 .59-.317.84-.707.457L5.586 15z" />
            </svg>
          </button>
        )}
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Choose the correct translation:</p>
      </div>

      {/* Options grid - stacks on small screens */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 w-full">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={!!feedback} // Disable buttons after an answer
            className={`w-full p-3 sm:p-3.5 rounded-lg text-sm sm:text-base md:text-lg font-medium transition-all duration-200 ease-in-out 
                        border-2 
                        ${!feedback ? 'bg-white hover:bg-sky-50 active:bg-sky-100 border-sky-400 text-sky-700' : 
                          option === currentCard.translation ? 'bg-green-500 text-white border-green-600' : 
                          feedback === 'incorrect' && option !== currentCard.translation ? 'bg-red-500 text-white border-red-600' : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue`}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-md w-full text-center text-sm sm:text-base font-semibold transition-opacity duration-500 
                        ${feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {feedback === 'correct' ? 'Correct!' : 'Incorrect. Try the next one!'}
        </div>
      )}

      <div className="w-full mt-3 sm:mt-4">
        <p className="text-sm sm:text-md font-semibold text-gray-700">Score: {score} / {vocabulary.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div 
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentCardIndex / vocabulary.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardTrainer;