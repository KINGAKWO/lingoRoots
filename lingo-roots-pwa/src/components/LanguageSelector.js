import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase'; // Assuming firebase config is in src/services/firebase.js
import { useAuth } from '../context/AuthContext'; // Assuming an AuthContext provides currentUser

const languages = [
  { id: 'duala', name: 'Duala', flag: '🇨🇲' },        // Cameroon
  { id: 'bassa', name: 'Bassa', flag: '🇨🇲' },        // Cameroon
  { id: 'ewondo', name: 'Ewondo', flag: '🇨🇲' },      // Cameroon
  { id: 'fula', name: 'Fula', flag: '🌍' },          // West Africa (generic flag)
  { id: 'wolof', name: 'Wolof', flag: '🇸🇳' },        // Senegal
  { id: 'yoruba', name: 'Yoruba', flag: '🇳🇬' },      // Nigeria
  { id: 'igbo', name: 'Igbo', flag: '🇳🇬' },          // Nigeria
  { id: 'swahili', name: 'Swahili', flag: '🇹🇿' },    // Tanzania (representative)
  { id: 'zulu', name: 'Zulu', flag: '🇿🇦' },          // South Africa
  { id: 'amharic', name: 'Amharic', flag: '🇪🇹' }      // Ethiopia
];

const LanguageSelector = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get currentUser from AuthContext 

  const handleLanguageSelect = async (language) => {
    console.log('Selected language:', language.name);
    try {
      if (currentUser && currentUser.uid) { // Ensure currentUser and uid exist
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Update user's profile with selected language
        // Using updateDoc assuming the user document already exists.
        // If it might not, you might need setDoc with merge:true
        await updateDoc(userDocRef, {
          selectedLanguageId: language.id,
          lastLanguageSelectedAt: new Date(),
        });
        console.log('Language preference saved to Firestore for user:', currentUser.uid);
      } else {
        localStorage.setItem('selectedLanguageId', language.id);
        console.log('Language preference saved to local storage.');
      }
      navigate('/learn'); // Redirect to the learning page
    } catch (error) {
      console.error('Error saving language preference:', error);
      // Handle error (e.g., show a notification to the user)
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-sky-50 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-marine-blue-dark mb-6 sm:mb-8 md:mb-12 text-center">
        Choose Your Language
      </h1>
      {/* Adjusted grid to be 1 column on smallest screens, then 2, then more */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 w-full max-w-5xl">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageSelect(lang)}
            onKeyPress={(e) => e.key === 'Enter' && handleLanguageSelect(lang)} // Accessibility for keyboard nav
            className="flex flex-col items-center justify-center p-3 xs:p-4 sm:p-5 bg-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 aspect-square"
            aria-label={`Select ${lang.name}`}
            role="button"
            tabIndex={0}
          >
            <span className="text-3xl xs:text-4xl sm:text-5xl mb-1.5 xs:mb-2 sm:mb-3" role="img" aria-label={`${lang.name} flag`}>{lang.flag}</span>
            <span className="text-xs xs:text-sm sm:text-base font-semibold text-marine-blue-dark text-center">{lang.name}</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default LanguageSelector;

// Note: 
// 1. Ensure you have an AuthContext implemented and provide it higher up in your component tree.
//    The placeholder AuthContext and useAuth here are for demonstration.
// 2. The path to firebase config `../services/firebase` should match your project structure.
// 3. Firestore rules must allow users to update their own 'selectedLanguageId' field in their user document.
// 4. Tailwind CSS needs to be properly configured in your project.
// 5. `react-router-dom` should be installed and set up for navigation.