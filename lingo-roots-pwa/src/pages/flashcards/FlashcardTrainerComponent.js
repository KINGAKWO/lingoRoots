import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import FlashcardComponent from '../../components/flashcards/FlashcardComponent';
import MainLayout from '../../layouts/MainLayout';
import './FlashcardTrainerComponent.css';

const FlashcardTrainerComponent = () => {
  const { langId, lessonId } = useParams(); // Assuming flashcards are tied to a lesson
  // Or, if standalone: const { langId, setId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0, total: 0 });
  const [cardStatus, setCardStatus] = useState({}); // { cardId: 'known' | 'unknown' }

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    const fetchFlashcards = async () => {
      setLoading(true);
      setError(null);
      try {
        // Path: languages/{langId}/lessons/{lessonId}/flashcards
        // Or: languages/{langId}/flashcardSets/{setId}/cards
        const flashcardsPath = `languages/${langId}/lessons/${lessonId}/flashcards`;
        const flashcardsCol = collection(db, flashcardsPath);
        const flashcardsSnap = await getDocs(flashcardsCol);

        if (flashcardsSnap.empty) {
          setError('No flashcards found for this lesson.');
          setFlashcards([]);
          setLoading(false);
          return;
        }

        const fetchedFlashcards = flashcardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFlashcards(fetchedFlashcards);
        setSessionStats(prev => ({ ...prev, total: fetchedFlashcards.length }));
        // Initialize card status
        const initialStatus = {};
        fetchedFlashcards.forEach(card => initialStatus[card.id] = null);
        setCardStatus(initialStatus);

      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError(`Failed to load flashcards: ${err.message}.`);
        toast.error(`Failed to load flashcards: ${err.message}`);
      }
      setLoading(false);
    };

    fetchFlashcards();
  }, [langId, lessonId, currentUser, navigate]);

  const handleCardAction = (knewIt) => {
    if (currentCardIndex >= flashcards.length) return;

    const cardId = flashcards[currentCardIndex].id;
    setCardStatus(prev => ({ ...prev, [cardId]: knewIt ? 'known' : 'unknown' }));

    if (knewIt) {
      setSessionStats(prev => ({ ...prev, known: prev.known + 1 }));
    } else {
      setSessionStats(prev => ({ ...prev, unknown: prev.unknown + 1 }));
    }

    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setShowResults(true);
      saveSessionProgress(); 
    }
  };

  const saveSessionProgress = async () => {
    if (!currentUser || flashcards.length === 0) return;
    
    const progressId = `${lessonId}_flashcards`; // Or a unique ID for the flashcard set
    const progressRef = doc(db, 'users', currentUser.uid, 'userProgress', progressId);

    try {
      await setDoc(progressRef, {
        langId,
        lessonId, // or setId
        type: 'flashcards',
        score: sessionStats.known,
        total: sessionStats.total,
        knownCards: flashcards.filter(card => cardStatus[card.id] === 'known').map(card => card.id),
        unknownCards: flashcards.filter(card => cardStatus[card.id] === 'unknown').map(card => card.id),
        completedAt: serverTimestamp(),
        lastAttemptedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Session progress saved!');
    } catch (err) {
      console.error('Error saving flashcard session progress:', err);
      toast.error(`Failed to save progress: ${err.message}`);
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setShowResults(false);
    setSessionStats({ known: 0, unknown: 0, total: flashcards.length });
    const initialStatus = {};
    flashcards.forEach(card => initialStatus[card.id] = null);
    setCardStatus(initialStatus);
  };

  if (loading) {
    return <MainLayout><div className="p-6 text-center text-gray-500">Loading flashcards...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="p-6 text-center text-red-500">Error: {error}</div></MainLayout>;
  }

  if (flashcards.length === 0 && !loading) {
    return <MainLayout><div className="p-6 text-center text-gray-500">No flashcards available for this lesson.</div></MainLayout>;
  }

  if (showResults) {
    return (
      <MainLayout>
        <div className="flashcard-trainer-results p-6 sm:p-8 max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-marine-blue dark:text-sky-300 mb-6">Session Complete!</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">Total Cards: {sessionStats.total}</p>
          <p className="text-lg text-green-600 dark:text-green-400 mb-2">Known: {sessionStats.known}</p>
          <p className="text-lg text-red-600 dark:text-red-400 mb-6">Unknown: {sessionStats.unknown}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={restartSession}
              className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
            >
              Practice Again
            </button>
            <button 
              onClick={() => navigate(`/lessons/${langId}/${lessonId}`)} // Or back to lesson list / dashboard
              className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flashcard-trainer-container p-4 sm:p-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-marine-blue dark:text-sky-300">Flashcard Practice</h1>
          <p className="text-gray-600 dark:text-gray-400">Card {currentCardIndex + 1} of {flashcards.length}</p>
        </header>

        {flashcards.length > 0 && currentCardIndex < flashcards.length && (
          <div className="flashcard-display-area mx-auto mb-6" style={{ maxWidth: '350px' }}>
            <FlashcardComponent card={flashcards[currentCardIndex]} />
          </div>
        )}

        <div className="controls-area flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
          <button 
            onClick={() => handleCardAction(false)} 
            className="w-full sm:w-auto px-8 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors text-lg font-semibold"
          >
            Didn't Know
          </button>
          <button 
            onClick={() => handleCardAction(true)} 
            className="w-full sm:w-auto px-8 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors text-lg font-semibold"
          >
            Knew It!
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlashcardTrainerComponent;