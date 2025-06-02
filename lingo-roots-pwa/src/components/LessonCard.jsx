import React from 'react';

const LessonCard = ({ lesson }) => {
  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-xl font-semibold">{lesson.title}</h2>
      <p>{lesson.description}</p>
      {/* Add navigation to lesson details */}
    </div>
  );
};

export default LessonCard;
