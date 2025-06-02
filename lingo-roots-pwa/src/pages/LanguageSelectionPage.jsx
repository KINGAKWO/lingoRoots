import React, { useEffect, useState } from 'react';
import LanguageCard from '../components/LanguageCard';
import { fetchLanguages } from '../services/languageService';

const LanguageSelectionPage = () => {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    fetchLanguages().then(setLanguages);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Select a Language</h1>
      <div className="grid grid-cols-2 gap-4">
        {languages.map((lang) => (
          <LanguageCard key={lang.id} language={lang} />
        ))}
      </div>
    </div>
  );
};

export default LanguageSelectionPage;
