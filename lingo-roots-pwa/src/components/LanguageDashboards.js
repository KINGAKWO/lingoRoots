import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Import Firestore instance
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import LessonList from './LessonList'; // We'll create this next

const LanguageDashboard = ({ languageId = "Duala", userId}) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLanguageAndLessons = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch language details (optional for now, but good practice)
        // For MVP, we can skip fetching the language document itself if not strictly needed for display
        // const langDocRef = doc(db, "languages", languageId);
        // const langDocSnap = await getDoc(langDocRef);
        // if (langDocSnap.exists()) {
        //   // setLanguage({ id: langDocSnap.id, ...langDocSnap.data() }); // Removed as language state is not used
        // } else {
        //   setError("Language not found");
        //   setLoading(false);
        //   return;
        // }

        //Fetch lessons for the given language from its subcollection
        const lessonsPath = `languages/${languageId}/lessons`;

        // Fetch lessons for the given language
        const lessonsQuery = query(
          collection(db, lessonsPath),
          //where("languageId", "==", languageId),
          where("published", "==", true), // Only fetch published lessons
          orderBy("order") // Order lessons by the 'order' field
        );

        const querySnapshot = await getDocs(lessonsQuery);
        console.log("Query Snapshot:", querySnapshot.docs.length, "lessons found for", languageId)//for debugging
        const lessonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLessons(lessonsData);

      } catch (err) {
        console.error("Error fetching language data:", err);
        setError("Failed to load language data. " + err.message);
      }
      setLoading(false);
    };

    if (languageId) {
      fetchLanguageAndLessons();
    }
  }, [languageId]);

  if (loading) return <p>Loading language dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  // if (!language) return <p>Language details not found.</p>; // Uncomment if fetching language doc

  return (
    <div>
      {/* <h2>{language.name} Lessons</h2>  Uncomment if fetching language doc and want to display name */}
      <h2>Lessons</h2>
      <LessonList lessons={lessons} userId={userId} languageId={languageId} />
    </div>
  );
};

export default LanguageDashboard;