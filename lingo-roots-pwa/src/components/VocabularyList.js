import React, { useState, useEffect } from 'react';
import { db, storage as firebaseStorage } from '../firebase'; // Import Firestore and Storage
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const VocabularyList = ({ words, languageId }) => { // Changed props: lessonId removed, words added
  // State for audio URLs is still needed if we fetch them on demand or pre-fetch based on `words` prop
  const [audioUrls, setAudioUrls] = useState({});
  const [loadingAudio, setLoadingAudio] = useState(false); // Optional: for loading state of audio

  // Effect to pre-fetch audio URLs when `words` prop changes
  useEffect(() => {
    const preFetchAudioUrls = async () => {
      if (!words || words.length === 0) {
        setAudioUrls({});
        return;
      }
      setLoadingAudio(true);
      const urls = {};
      for (const item of words) {
        // Ensure item.id is unique and item.audioUrl exists
        // The audioUrl in Firestore should be the full path like 'languages/duala/audio/mbote.mp3'
        // Or, if it's just 'mbote.mp3', we might need to construct the full path here using languageId
        if (item.id && item.audio) { // Assuming 'audio' field stores the relative path or full gs:// URL
          try {
            // If item.audio is a full gs:// path, ref() will handle it.
            // If item.audio is a relative path like 'audio/mbote.mp3' and languageId is 'duala',
            // construct path: `languages/${languageId}/${item.audio}`
            // For simplicity, let's assume item.audio is the path that firebaseStorage.ref can use directly
            // or it's a full gs:// URL. If it's a relative path within the language folder, adjust accordingly.
            // Example: const audioPath = item.audio.startsWith('gs://') ? item.audio : `languages/${languageId}/${item.audio}`;
            const audioRef = ref(firebaseStorage, item.audio); // Use item.audio directly if it's a full path
            urls[item.id] = await getDownloadURL(audioRef);
          } catch (audioError) {
            console.warn(`Could not get audio URL for item ID ${item.id} (path: ${item.audio}):`, audioError);
            urls[item.id] = null; // Mark as failed to load
          }
        }
      }
      setAudioUrls(urls);
      setLoadingAudio(false);
    };

    preFetchAudioUrls();
  }, [words, languageId]); // Rerun if words or languageId changes

  if (!words || words.length === 0) {
    return <p className="vocabulary-status">No vocabulary items for this step.</p>;
  }

  const playAudio = (audioSrc) => {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  // Render loading state for audio if desired
  if (loadingAudio) return <p className="vocabulary-status">Loading audio...</p>;

  return (
    <div className="vocabulary-grid-container">
      {/* The title "Key Vocabulary" is now part of LessonPage's step.title */}
      {/* <h5>Vocabulary:</h5> */}
      <div className="vocabulary-grid">
        {words.map(item => (
          // Each item is a card
          <div key={item.id || item.original} className="vocabulary-card">
            <div className="vocabulary-term-local">{item.original}</div>
            <div className="vocabulary-term-translation">{item.translation}</div>
            {/* Assuming item.audio is the path and audioUrls[item.id] holds the playable URL */}
            {audioUrls[item.id] && (
              <button onClick={() => playAudio(audioUrls[item.id])} className="listen-button">
                {/* Icon can be added here, e.g., <Volume2 size={16} /> */}
                <span role="img" aria-label="listen">🔊</span> Listen
              </button>
            )}
            {/* Show a message if audio was expected but failed to load */}
            {item.audio && !audioUrls[item.id] && !loadingAudio && (
              <span className="audio-status-error">(Audio not available)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabularyList;