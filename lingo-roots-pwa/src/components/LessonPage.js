import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import VocabularyList from './VocabularyList';
import Quiz from './Quiz'; // Assuming Quiz component is suitable
import './LessonPage.css'; // CSS for overall page styling
// Icons could be imported from a library like lucide-react if used consistently
// import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';

const LessonPage = ({ userId }) => {
  const { languageId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!languageId || !lessonId) {
        setError('Language ID or Lesson ID is missing.');
        setLoading(false);
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
    if (lesson && currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (lesson && currentStepIndex === lesson.steps.length - 1) {
      // Mark lesson as complete or navigate away
      // For now, navigate back to the language dashboard or a specific completion page
      alert('Lesson completed! Redirecting...'); // Placeholder
      navigate(`/languages/${languageId}`); // Example: navigate back to language dashboard
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (loading) return <div className="lesson-page-status"><p>Loading lesson...</p></div>;
  if (error) return <div className="lesson-page-status error"><p>Error: {error}</p></div>;
  if (!lesson) return <div className="lesson-page-status"><p>Lesson data could not be loaded or is empty.</p></div>;

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
        return (
          <Quiz 
            lessonId={lesson.id} // Or currentStep.quizId if specific to step
            languageId={languageId} 
            userId={userId} 
            onQuizComplete={(score, numQuestions) => {
              console.log(`Quiz completed for step! Score: ${score}/${numQuestions}`);
              // Decide if quiz completion automatically moves to next step or shows summary
              // For now, user clicks Next manually after quiz.
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