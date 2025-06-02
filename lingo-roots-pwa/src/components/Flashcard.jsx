import React, { useState } from 'react';

const Flashcard = ({ card }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="border p-4 rounded shadow mb-4 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <p className="text-xl">
        {flipped ? card.translation : card.term}
      </p>
    </div>
  );
};

export default Flashcard;
