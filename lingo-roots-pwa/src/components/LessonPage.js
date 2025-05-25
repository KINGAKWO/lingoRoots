import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Import Firebase Functions
import { db, auth } from '../services/firebase'; // Assuming auth is exported for userId
import Quiz from './Quiz'; // Your Quiz component
import VocabularyList from './VocabularyList';
// Icons could be imported from a library like lucide-react if used consistently
// import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';

const LessonPage = () => {
  const { languageId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizUserAnswers, setQuizUserAnswers] = useState({});
  const [userId, setUserId] = useState(null);

  // Get Firebase Functions instance
  const functionsInstance = getFunctions(); // Correct way to get instance

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // navigate('/signin'); // Or handle unauthenticated state
      }
    });
    return () => unsubscribe();
  }, [navigate]);


  useEffect(() => {
    const fetchLesson = async () => {
      if (!languageId || !lessonId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const lessonPath = `languages/${languageId}/lessons/${lessonId}`;
        const lessonDocRef = doc(db, lessonPath);
        const lessonDocSnap = await getDoc(lessonDocRef);

        if (lessonDocSnap.exists()) {
          const lessonData = { id: lessonDocSnap.id, ...lessonDocSnap.data() };
          // Ensure lessonData.steps is an array and not empty
          if (Array.isArray(lessonData.steps) && lessonData.steps.length > 0) {
            setLesson(lessonData);
          } else {
            setError('Lesson content is missing or invalid (no steps).');
            setLesson(null);
            console.warn('Lesson data fetched but steps array is missing or empty:', lessonData);
          }
        } else {
          setError('Lesson not found.');
          setLesson(null);
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson data. ' + err.message);
        setLesson(null);
      }
      setLoading(false);
    };

    fetchLesson();
  }, [languageId, lessonId]);

  const handleNextStep = () => {
    const currentStep = lesson.steps[currentStepIndex];
    if (currentStep.type === 'quiz' || currentStep.type === 'practice') {
      // Process quiz answers here (e.g., save to Firestore, calculate score)
      console.log('Quiz answers for step:', currentStep.title, quizUserAnswers);
      // For now, just log. Backend integration will handle saving.
      // Optionally, reset answers if each quiz step is independent
      // setQuizUserAnswers({}); 
    }

    if (lesson && currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      // If the next step is a new quiz, reset answers. 
      // This assumes quizzes don't span multiple visual steps with persistent answers.
      if (lesson.steps[currentStepIndex + 1]?.type === 'quiz' || lesson.steps[currentStepIndex + 1]?.type === 'practice') {
        setQuizUserAnswers({});
      }
    } else if (lesson && currentStepIndex === lesson.steps.length - 1) {
      alert('Lesson completed! Redirecting...'); // Placeholder
      navigate(`/lessons`); // Navigate to the main languages/lessons overview page
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      // If moving back to a quiz, answers might need to be re-evaluated or kept.
      // For simplicity, current answers are preserved if user navigates back and forth within a quiz step.
      // If moving to a *different* previous step that was a quiz, answers for *that* quiz are not re-loaded by this.
      // This assumes quizUserAnswers is for the *current* quiz step.
    }
  };

  if (loading) return <div className="lesson-page-status"><p>Loading lesson...</p></div>;
  if (error) return <div className="lesson-page-status error"><p>Error: {error}</p></div>;
  if (!lesson) return <div className="lesson-page-status"><p>Lesson data could not be loaded or is empty.</p></div>;

  // Ensure currentStep exists before trying to access its properties
  if (!lesson.steps || currentStepIndex >= lesson.steps.length) {
    return <div className="lesson-page-status"><p>Lesson step not found.</p></div>;
  }
  const currentStep = lesson.steps[currentStepIndex];
  const totalSteps = lesson.steps.length;
  const progressPercentage = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const renderStepContent = () => {
    if (!currentStep) return <p className="step-content-status">Step content not available.</p>;

    switch (currentStep.type) {
      case 'introduction':
      case 'explanation':
      case 'summary':
        return (
          <div className="step-content-text">
            {currentStep.image && <img src={currentStep.image} alt={currentStep.title || 'Lesson image'} className="step-image" />}
            <p>{currentStep.content}</p>
          </div>
        );
      case 'vocabulary':
        // VocabularyList will be updated to accept 'words' prop and 'languageId'
        return <VocabularyList words={currentStep.words || []} languageId={languageId} />;
      case 'quiz':
      case 'practice': // Assuming 'practice' might also use the Quiz component or similar structure
        // Ensure currentStep.questions is an array; provide empty array if not to prevent Quiz component error
        const questions = Array.isArray(currentStep.questions) ? currentStep.questions : [];
        if (questions.length === 0 && currentStep.type === 'quiz') {
            console.warn("Quiz step has no questions defined in lesson data for step title:", currentStep.title);
            // return <p className="step-content-status">Quiz questions are not available for this step.</p>;
        }
        return (
          <Quiz
            title={currentStep.title || 'Practice Session'} // Use step title for the quiz title
            questions={questions} 
            userAnswers={quizUserAnswers}
            onAnswerSelect={(questionId, answer) => {
              setQuizUserAnswers(prevAnswers => ({
                ...prevAnswers,
                [questionId]: answer,
              }));
            }}
          />
        );
      default:
        return <p className="step-content-status">Unsupported step type: {currentStep.type}</p>;
    }
  };

  return (
    <div className="lesson-page-container">
      {/* Header section (e.g., LingoRoots, Home, Dashboard links) would typically be part of a global Layout component */}
      {/* For this page, we focus on the lesson-specific UI elements from the image */} 

      <div className="progress-section">
        <div className="progress-bar-info">
          <span>Progress</span>
          <span>{currentStepIndex + 1} of {totalSteps}</span>
        </div>
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="lesson-step-card">
        {currentStep.title && <h2 className="step-title">{currentStep.title}</h2>}
        <div className="step-content-wrapper">
          {renderStepContent()}
        </div>
      </div>

      <div className="lesson-navigation">
        <button 
          onClick={handlePreviousStep} 
          disabled={currentStepIndex === 0}
          className="nav-button prev-button"
        >
          {/* <ArrowLeft size={18} /> Optional Icon */}
          &larr; Previous
        </button>
        <button 
          onClick={handleNextStep} 
          className="nav-button next-button"
        >
          {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
          {/* <ArrowRight size={18} /> Optional Icon */}
          &rarr;
        </button>
      </div>
    </div>
  );
};

export default LessonPage;