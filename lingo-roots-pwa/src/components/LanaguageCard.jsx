import React from 'react';

const LanguageCard = ({ language }) => {
  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-xl font-semibold">{language.name}</h2>
      {/* Add more details as needed */}
    </div>
  );
};

export default LanguageCard;
