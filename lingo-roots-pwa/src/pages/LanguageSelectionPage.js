import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase'; // Adjust path if necessary
import { AuthContext } from '../context/AuthContext'; // Adjust path if necessary
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { getLanguages } from '../services/languageService';


const LanguageIcon = ({ langCode }) => {
  // In a real app, you might use SVGs or a library like react-icons
  // For now, a simple placeholder
  let emoji = '🌐';
  if (langCode === 'duala') emoji = '🇨🇲'; // Example Cameroon flag for Duala
  if (langCode === 'bassa') emoji = '🇱🇷'; // Example Liberia flag for Bassa (can be Cameroon too)
  // Add more specific flags or icons as needed
  return <span className="text-4xl mr-3">{emoji}</span>;
};

const LanguageSelectionPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLanguagesAndUserPreferences = async () => {
      if (!currentUser) {
        setLoading(false);
        setError('User not authenticated. Please log in.');
        return;
      }
      try {
        // Fetch available languages
        const languagesCollectionRef = collection(db, 'languages');
        const languagesSnapshot = await getDocs(languagesCollectionRef);
        const languagesList = languagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLanguages(languagesList);

        // Fetch user's current selected languages
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().selectedLanguages) {
          setSelectedLanguages(userDocSnap.data().selectedLanguages);
        }

      } catch (err) {
        console.error("Error fetching data: ", err);
        setError('Failed to load languages. Please try again later.');
      }
      setLoading(false);
    };

    fetchLanguagesAndUserPreferences();
  }, [currentUser]);

  const handleLanguageToggle = async (langId) => {
    if (!currentUser) {
      setError('User not authenticated.');
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      if (selectedLanguages.includes(langId)) {
        // Remove language
        await updateDoc(userDocRef, {
          selectedLanguages: arrayRemove(langId)
        });
        setSelectedLanguages(prev => prev.filter(id => id !== langId));
      } else {
        // Add language
        await updateDoc(userDocRef, {
          selectedLanguages: arrayUnion(langId)
        });
        setSelectedLanguages(prev => [...prev, langId]);
      }
    } catch (err) {
      console.error("Error updating language preferences: ", err);
      setError('Failed to update preferences. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-gray-600">Loading languages...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-red-600">{error}</p></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-6">
        <p className="text-lg text-red-500 mb-4">You need to be logged in to select languages.</p>
        <button 
          onClick={() => navigate('/login')} 
          className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-marine-blue dark:text-sky-400">Choose Your Languages</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Select the languages you want to learn or practice.</p>
      </header>

      {languages.length === 0 && !loading && (
        <p className="text-center text-gray-500 dark:text-gray-400">No languages available at the moment. Please check back later.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageToggle(lang.id)}
            className={`p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 
                        flex flex-col items-center justify-center text-center 
                        ${selectedLanguages.includes(lang.id) 
                          ? 'bg-sky-500 dark:bg-sky-600 text-white ring-2 ring-sky-300 dark:ring-sky-500'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-gray-600'}`}
          >
            <LanguageIcon langCode={lang.id} />
            <span className="mt-2 text-lg sm:text-xl font-semibold">{lang.name || lang.id}</span>
            {lang.nativeName && <span className="text-xs text-gray-500 dark:text-gray-400">({lang.nativeName})</span>}
          </button>
        ))}
      </div>

      {selectedLanguages.length > 0 && (
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/dashboard')} // Or any other relevant page
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors text-lg"
          >
            Continue to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelectionPage;