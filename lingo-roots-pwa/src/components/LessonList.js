import React, { useState } from 'react';
import VocabularyList from './VocabularyList'; // We'll create this next

const LessonList = ({ lessons }) => {
  const [selectedLesson, setSelectedLesson] = useState(null);

  if (!lessons || lessons.length === 0) {
    return <p>No lessons available for this language yet.</p>;
  }

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
  };

  return (
    <div>
      <h3>Available Lessons:</h3>
      <ul>
        {lessons.map(lesson => (
          <li key={lesson.id} onClick={() => handleLessonClick(lesson)} style={{ cursor: 'pointer' }}>
            {lesson.order}. {lesson.title} ({lesson.type})
          </li>
        ))}
      </ul>
      <hr />
      {selectedLesson && (
        <div>
          <h4>Selected Lesson: {selectedLesson.title}</h4>
          <p>{selectedLesson.content}</p>
          {selectedLesson.type === 'vocabulary' && (
            <VocabularyList lessonId={selectedLesson.id} languageId={selectedLesson.languageId} />
          )}
          {/* Add more conditions here for other lesson types like grammar, quizzes etc. */}
        </div>
      )}
    </div>
  );
};

export default LessonList;