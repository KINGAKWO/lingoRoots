import React, { useEffect, useState } from 'react';
import LessonCard from '../components/LessonCard';
import { fetchLessons } from '../services/lessonService';

const LessonListPage = ({ selectedLanguage }) => {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    fetchLessons(selectedLanguage).then(setLessons);
  }, [selectedLanguage]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Lessons for {selectedLanguage}</h1>
      <div className="grid grid-cols-1 gap-4">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
};

export default LessonListPage;
