import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import MainLayout from '../layouts/MainLayout';

const LessonPage = () => {
  const { langId, lessonId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [lessonsInLanguage, setLessonsInLanguage] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    const fetchLessonAndProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current lesson
        const lessonRef = doc(db, 'languages', langId, 'lessons', lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          setError('Lesson not found.');
          setLoading(false);
          return;
        }
        setLesson({ id: lessonSnap.id, ...lessonSnap.data() });

        // Fetch all lessons in the language for navigation
        const lessonsQuery = query(collection(db, 'languages', langId, 'lessons'), orderBy('order', 'asc')); // Assuming an 'order' field
        const lessonsSnap = await getDocs(lessonsQuery);
        const allLessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLessonsInLanguage(allLessons);

        const currentLessonIndex = allLessons.findIndex(l => l.id === lessonId);
        setCurrentIndex(currentLessonIndex);

        // Check completion status
        // User progress for a language is stored in a single document per language
        const langProgressRef = doc(db, 'users', currentUser.uid, 'userProgress', langId);
        const langProgressSnap = await getDoc(langProgressRef);
        if (langProgressSnap.exists()) {
          const progressData = langProgressSnap.data();
          if (progressData.completedLessons && progressData.completedLessons.includes(lessonId)) {
            setIsCompleted(true);
          } else {
            setIsCompleted(false);
          }
        } else {
          setIsCompleted(false);
        }

      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(`Failed to load lesson data: ${err.message}. Please try again.`);
        toast.error(`Failed to load lesson data: ${err.message}`);
      }
      setLoading(false);
    };

    fetchLessonAndProgress();
  }, [langId, lessonId, currentUser, navigate]);

  const handleMarkAsComplete = async () => {
    if (!currentUser || !lesson) return;
    try {
      const langProgressRef = doc(db, 'users', currentUser.uid, 'userProgress', langId);
      const langProgressSnap = await getDoc(langProgressRef);

      let newProgressData = {
        completedLessons: [lesson.id],
        activeLessons: {},
        totalPoints: lesson.points || 10, // Award some points for lesson completion, default 10
        wordsLearnedCount: (lesson.wordsInLesson || 5) + (langProgressSnap.exists() ? langProgressSnap.data().wordsLearnedCount || 0 : 0), // Add words from this lesson
        lastUpdatedAt: serverTimestamp(),
      };

      if (langProgressSnap.exists()) {
        const existingData = langProgressSnap.data();
        newProgressData.completedLessons = Array.from(new Set([...(existingData.completedLessons || []), lesson.id]));
        newProgressData.activeLessons = { ...(existingData.activeLessons || {}) };
        delete newProgressData.activeLessons[lesson.id]; // Remove from active if it was there
        newProgressData.totalPoints = (existingData.totalPoints || 0) + (lesson.points || 10);
        // wordsLearnedCount is already handled by adding to existing or 0
      } else {
        // This is the first lesson completed for this language by the user
        // wordsLearnedCount and totalPoints are set as above
      }

      await setDoc(langProgressRef, newProgressData, { merge: true });
      setIsCompleted(true);
      toast.success('Lesson marked as complete! Progress saved.');

      // Potentially update a local state for immediate UI feedback if needed
      // e.g., if LearnerDashboard was using a context, we could update it here.

    } catch (err) {
      console.error('Error marking lesson complete:', err);
      setError(`Failed to update progress: ${err.message}. Please try again.`);
      toast.error(`Failed to update progress: ${err.message}`);
    }
  };

  const navigateToLesson = (direction) => {
    if (currentIndex === -1 || lessonsInLanguage.length === 0) return;
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < lessonsInLanguage.length) {
      const nextLessonId = lessonsInLanguage[newIndex].id;
      navigate(`/lessons/${langId}/${nextLessonId}`);
    }
  };

  if (loading) {
    return <MainLayout><div className="p-6 text-center text-gray-500">Loading lesson...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="p-6 text-center text-red-500">Error: {error}</div></MainLayout>;
  }

  if (!lesson) {
    return <MainLayout><div className="p-6 text-center text-gray-500">Lesson not found.</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-marine-blue mb-2">{lesson.title}</h1>
          <p className="text-sm text-gray-500">Language: {langId.charAt(0).toUpperCase() + langId.slice(1)}</p>
        </header>

        <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-semibold text-sky-700 dark:text-sky-500 mb-4">Lesson Content</h2>
          {lesson.textContent ? (
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.textContent }}></div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No text content available for this lesson.</p>
          )}

          {lesson.videoUrl && (
            <div className="my-6">
              <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-3">Video</h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe 
                  src={`https://www.youtube.com/embed/${lesson.videoUrl.split('v=')[1] || lesson.videoUrl.split('/').pop()}`} 
                  title={lesson.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full rounded-md shadow-md"
                ></iframe>
              </div>
            </div>
          )}
          
          {/* Placeholder for Image Content */}
          {lesson.imageUrl && (
             <div className="my-6">
                <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-3">Image</h3>
                <img src={lesson.imageUrl} alt={lesson.title || 'Lesson image'} className="max-w-full h-auto rounded-md shadow-md" />
             </div>
          )}
          {!lesson.imageUrl && lesson.imagePlaceholder && (
            <div className="my-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
              <p className="text-gray-500 dark:text-gray-400">[Image Placeholder: {lesson.imagePlaceholder}]</p>
            </div>
          )}

          {/* Placeholder for Audio Content */}
          {lesson.audioUrl && (
            <div className="my-6">
              <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-3">Audio</h3>
              <audio controls src={lesson.audioUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          {!lesson.audioUrl && lesson.audioPlaceholder && (
            <div className="my-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
              <p className="text-gray-500 dark:text-gray-400">[Audio Placeholder: {lesson.audioPlaceholder}]</p>
            </div>
          )}
        </article>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <button 
            onClick={() => navigateToLesson(-1)}
            disabled={currentIndex <= 0}
            className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Previous Lesson
          </button>
          
          {!isCompleted ? (
            <button 
              onClick={handleMarkAsComplete}
              className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Mark as Complete
            </button>
          ) : (
            <div className="w-full sm:w-auto px-6 py-3 text-center bg-green-100 text-green-700 rounded-md dark:bg-green-700 dark:text-green-100">
              ✓ Completed
            </div>
          )}

          <button 
            onClick={() => navigateToLesson(1)}
            disabled={currentIndex === -1 || currentIndex >= lessonsInLanguage.length - 1}
            className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Next Lesson
          </button>
        </div>

        <div className="text-center">
          <Link 
            to={`/lessons/${langId}`}
            className="text-marine-blue hover:text-marine-blue-dark dark:text-sky-400 dark:hover:text-sky-300 font-semibold transition-colors"
          >
            Back to Lesson List
          </Link>
        </div>

      </div>
    </MainLayout>
  );
};

export default LessonPage;