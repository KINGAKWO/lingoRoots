import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Assuming AuthContext provides currentUser and their details
import { db } from '../services/firebase'; // Assuming firebase is initialized in services
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import MainLayout from '../layouts/MainLayout'; // Assuming a MainLayout component exists

const LessonListPage = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin'); // Redirect to signin if not authenticated
      return;
    }

    const fetchUserAndLessons = async () => {
      try {
        setLoading(true);
        // 1. Fetch user's selected language(s)
        // Assuming user document has a field 'selectedLanguages' which is an array, 
        // and we'll use the first one for now, or a specific 'activeLearningLanguage'.
        // For this example, let's assume 'selectedLanguages' is an array and we take the first one.
        // Or, if LanguageSelectionPage stores it in a more specific way, adjust accordingly.
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Prioritize 'activeLearningLanguage' if it exists, otherwise take the first from 'selectedLanguages'
          const langId = userData.activeLearningLanguage || (userData.selectedLanguages && userData.selectedLanguages[0]);
          
          if (langId) {
            setSelectedLanguage(langId); // Store the language ID
            // 2. Fetch lessons for that language
            const lessonsRef = collection(db, 'languages', langId, 'lessons');
            const q = query(lessonsRef); // Add orderBy if lessons have an 'order' field, e.g., orderBy('lessonNumber')
            const querySnapshot = await getDocs(q);
            const fetchedLessons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLessons(fetchedLessons);
          } else {
            setError('No language selected. Please select a language first.');
            // Potentially navigate to language selection page
            // navigate('/select-language'); 
          }
        } else {
          setError('User data not found.');
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndLessons();
  }, [currentUser, navigate]);

  if (loading) {
    return <MainLayout><div className="p-4 sm:p-6 text-center text-gray-500">Loading lessons...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="p-4 sm:p-6 text-center text-red-500">Error: {error}</div></MainLayout>;
  }

  if (!selectedLanguage) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 text-center text-gray-500">
          <p>Please select a language to view lessons.</p>
          {/* Optional: Add a button to navigate to language selection */}
          {/* <button onClick={() => navigate('/select-language')} className="mt-4 px-4 py-2 bg-marine-blue text-white rounded hover:bg-marine-blue-dark">Select Language</button> */}
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-marine-blue text-center">
            Lessons for {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} {/** Assumes langId is a string like 'duala' */}
          </h1>
        </header>

        {lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map(lesson => (
              <div 
                key={lesson.id} 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/lessons/${selectedLanguage}/${lesson.id}`)} // Navigate to specific lesson page
              >
                <h2 className="text-xl font-semibold text-sky-700 dark:text-sky-500 mb-2">{lesson.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {lesson.description || 'No description available.'}
                </p>
                {/* You can add more details like difficulty, estimated time, etc. */}
                <div className="mt-auto">
                  <button 
                    className="w-full py-2 px-4 bg-marine-blue text-white rounded-md hover:bg-marine-blue-dark transition-colors"
                  >
                    Start Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <p className="text-xl mb-2">No lessons available for this language yet.</p>
            <p>Please check back later or try selecting a different language.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LessonListPage;