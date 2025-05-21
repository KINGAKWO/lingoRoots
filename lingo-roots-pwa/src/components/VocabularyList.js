import React, { useState, useEffect } from 'react';
import { db, storage as firebaseStorage } from '../firebase'; // Import Firestore and Storage
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const VocabularyList = ({ lessonId, languageId }) => {
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioUrls, setAudioUrls] = useState({}); // To store fetched audio URLs

  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!lessonId || !languageId) return;
      setLoading(true);
      setError(null);
      setVocabulary([]);
      setAudioUrls({});
      try {
        const vocabPath = `languages/${languageId}/vocabularyItems`; // Path to the subcollection
        const vocabQuery = query(
          collection(db, vocabPath),
          where("lessonId", "==", lessonId)
          // Optionally add orderBy if you have an order field for vocab items
        );
        const querySnapshot = await getDocs(vocabQuery);
        console.log("Vocabulary Snapshot:", querySnapshot.docs.length, "items found for lesson", lessonId, "in language", languageId);
        const vocabData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVocabulary(vocabData);

        // Pre-fetch audio URLs
        const urls = {};
        for (const item of vocabData) {
          if (item.audioUrl) {
            try {
              const audioRef = ref(firebaseStorage, item.audioUrl);
              urls[item.id] = await getDownloadURL(audioRef);
            } catch (audioError) {
              console.warn(`Could not get audio URL for ${item.audioUrl}:`, audioError);
              urls[item.id] = null; // or some placeholder/error indicator
            }
          }
        }
        setAudioUrls(urls);

      } catch (err) {
        console.error("Error fetching vocabulary:", err);
        if (err.message.includes("ERR_NETWORK_CHANGED") || err.code === "unavailable") {
          setError("Network connection issue. Please check your internet and try again.");
        } else {
          setError("Failed to load vocabulary. " + err.message);
        }
      }
      setLoading(false);
    };

    fetchVocabulary();
  }, [lessonId, languageId]);

  if (loading) return <p>Loading vocabulary...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  if (vocabulary.length === 0) {
    return <p>No vocabulary items found for this lesson.</p>;
  }

  const playAudio = (audioSrc) => {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  return (
    <div>
      <h5>Vocabulary:</h5>
      <ul>
        {vocabulary.map(item => (
          <li key={item.id}>
            <strong>{item.termLocal}</strong>: {item.termTranslation}
            {item.exampleSentenceLocal && <em> (e.g., "{item.exampleSentenceLocal}" - "{item.exampleSentenceTranslation}")</em>}
            {audioUrls[item.id] && (
              <button onClick={() => playAudio(audioUrls[item.id])} style={{ marginLeft: '10px' }}>
                Play Audio
              </button>
            )}
            {!audioUrls[item.id] && item.audioUrl && (
              <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>(Audio pending/error)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VocabularyList;