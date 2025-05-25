import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info
// import { db } from '../services/firebase'; // Assuming firebase is initialized in services
// import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const LearnerDashboard = () => {
  // const { currentUser } = useAuth(); // Get current user
  const [selectedLanguage, setSelectedLanguage] = useState(null); // e.g., { id: 'duala', name: 'Duala' }
  const [userProgress, setUserProgress] = useState({ modulesCompleted: 0, wordsLearned: 0 });
  const [learningModules, setLearningModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with Firestore fetching logic
  const mockSelectedLanguage = { id: 'duala', name: 'Duala' };
  const mockUserProgress = { modulesCompleted: 2, wordsLearned: 50 };
  const mockModules = [
    { id: 'module1', title: 'Greetings & Introductions', progress: 75, status: 'Continue' },
    { id: 'module2', title: 'Basic Vocabulary', progress: 30, status: 'Continue' },
    { id: 'module3', title: 'Forming Sentences', progress: 0, status: 'Start' },
  ];

  useEffect(() => {
    // --- Firestore Data Fetching Logic ---
    // 1. Get selected language (this might come from a global state or route param)
    // For now, using mock data
    setSelectedLanguage(mockSelectedLanguage);

    // 2. Fetch user progress for the selected language
    // const fetchUserProgress = async () => {
    //   if (currentUser && selectedLanguage) {
    //     const progressRef = doc(db, 'users', currentUser.uid, 'userProgress', selectedLanguage.id);
    //     const progressSnap = await getDoc(progressRef);
    //     if (progressSnap.exists()) {
    //       const data = progressSnap.data();
    //       setUserProgress({
    //         modulesCompleted: data.completedLessons ? data.completedLessons.length : 0,
    //         wordsLearned: data.points || 0, // Assuming points can represent words learned or similar metric
    //       });
    //     } else {
    //       setUserProgress({ modulesCompleted: 0, wordsLearned: 0 });
    //     }
    //   }
    // };
    setUserProgress(mockUserProgress); // Using mock data

    // 3. Fetch available learning modules for the selected language
    // const fetchModules = async () => {
    //   if (selectedLanguage) {
    //     const modulesRef = collection(db, 'languages', selectedLanguage.id, 'lessons'); // Assuming 'lessons' are 'modules'
    //     const q = query(modulesRef); // Add orderBy('order') if you have an order field
    //     const querySnapshot = await getDocs(q);
    //     const fetchedModules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //     // Map fetchedModules to include progress and status (requires more logic)
    //     setLearningModules(fetchedModules.map(m => ({ ...m, progress: Math.random() * 100, status: Math.random() > 0.5 ? 'Start' : 'Continue' }))); // Mock progress
    //   }
    // };
    setLearningModules(mockModules); // Using mock data

    // fetchUserProgress();
    // fetchModules();
    setLoading(false);
  }, [/* currentUser, selectedLanguage */]);

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
            <p className="text-2xl sm:text-3xl font-bold text-sky-600">{userProgress.wordsLearned}</p>
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