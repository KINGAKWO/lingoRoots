import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info
import { db } from '../services/firebase'; // Assuming firebase is initialized in services
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';

const LearnerDashboard = () => {
  const { currentUser } = useAuth(); // Get current user
  const [selectedLanguage, setSelectedLanguage] = useState(null); // e.g., { id: 'duala', name: 'Duala' }
  const [userProgress, setUserProgress] = useState({ modulesCompleted: 0, wordsLearned: 0, points: 0 });
  const [learningModules, setLearningModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Get user's primary language interest
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let languageIdToFetch = null;
        let languageName = 'Selected Language'; // Default name

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          languageIdToFetch = userData.primaryLanguageInterest; // Assuming this stores the ID like 'duala'
          // If primaryLanguageInterest stores an object like {id: 'duala', name: 'Duala'}, adjust accordingly
          // For now, assume it's an ID, and we need to fetch the language name
          if (languageIdToFetch) {
            const langDocRef = doc(db, 'languages', languageIdToFetch);
            const langDocSnap = await getDoc(langDocRef);
            if (langDocSnap.exists()) {
              languageName = langDocSnap.data().name || languageIdToFetch;
            }
            setSelectedLanguage({ id: languageIdToFetch, name: languageName });
          } else {
            // Handle case where user has no primary language selected
            // Maybe redirect to a language selection page or show a message
            console.log("User has no primary language selected.");
            setLoading(false);
            return;
          }
        } else {
          console.error("User document not found.");
          setLoading(false);
          return;
        }

        if (!languageIdToFetch) {
            setLoading(false);
            return;
        }

        // 2. Fetch user progress for the selected language
        const progressDocRef = doc(db, 'users', currentUser.uid, 'userProgress', languageIdToFetch);
        const progressDocSnap = await getDoc(progressDocRef);
        let currentProgressData = { completedLessons: [], activeLessons: {}, totalPoints: 0, wordsLearnedCount: 0 };

        if (progressDocSnap.exists()) {
          currentProgressData = progressDocSnap.data();
          setUserProgress({
            modulesCompleted: currentProgressData.completedLessons?.length || 0,
            wordsLearned: currentProgressData.wordsLearnedCount || 0,
            points: currentProgressData.totalPoints || 0,
          });
        } else {
          setUserProgress({ modulesCompleted: 0, wordsLearned: 0, points: 0 });
        }

        // 3. Fetch available learning modules (lessons) for the selected language
        const modulesRef = collection(db, 'languages', languageIdToFetch, 'lessons');
        const q = query(modulesRef, orderBy('order', 'asc')); // Assuming an 'order' field for modules
        const querySnapshot = await getDocs(q);
        const fetchedModules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Map fetchedModules to include progress and status
        const modulesWithProgress = fetchedModules.map(module => {
          let progress = 0;
          let status = 'Start';

          if (currentProgressData.completedLessons?.includes(module.id)) {
            progress = 100;
            status = 'Completed'; // Or 'Review'
          } else if (currentProgressData.activeLessons && currentProgressData.activeLessons[module.id]) {
            progress = currentProgressData.activeLessons[module.id].progressPercent || 0;
            status = 'Continue';
          }
          return { ...module, progress, status };
        });
        setLearningModules(modulesWithProgress);

      } catch (error) {
        console.error("Error fetching learner dashboard data:", error);
        // Optionally set an error state to display to the user
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div className="p-4 sm:p-6 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (!selectedLanguage) {
    return <div className="p-4 sm:p-6 text-center text-gray-500">Please select a language to start learning.</div>;
  }

  return (
    <div className="min-h-screen bg-sky-50 p-4 sm:p-6 lg:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-marine-blue">
          Learning: {selectedLanguage.name}
        </h1>
      </header>

      <section className="mb-6 md:mb-8 p-4 sm:p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl sm:text-2xl font-semibold text-marine-blue mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-sky-100 p-4 rounded-md">
            <p className="text-base sm:text-lg text-gray-700">Modules Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-sky-600">{userProgress.modulesCompleted}</p>
          </div>
          <div className="bg-sky-100 p-4 rounded-md">
            <p className="text-base sm:text-lg text-gray-700">Words Learned (Points)</p>
            <p className="text-2xl sm:text-3xl font-bold text-sky-600">{userProgress.wordsLearned} ({userProgress.points} pts)</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-marine-blue mb-4 sm:mb-6">Available Modules</h2>
        {learningModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {learningModules.map((module) => (
              <div key={module.id} className="bg-white shadow-lg rounded-lg p-4 sm:p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-marine-blue mb-2">{module.title}</h3>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-sky-500 h-2.5 rounded-full"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">{module.progress}% completed</p>
                </div>
                <button
                  className={`w-full py-2.5 px-4 rounded-md text-sm sm:text-base font-semibold text-white transition-colors 
                              ${module.status === 'Start' ? 'bg-marine-blue hover:bg-marine-blue-dark' : 'bg-sky-600 hover:bg-sky-700'}`}
                  // onClick={() => handleModuleNavigation(module.id)} // Implement navigation
                >
                  {module.status}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No modules available for this language yet. Check back soon!</p>
        )}
      </section>
    </div>
  );
};

export default LearnerDashboard;