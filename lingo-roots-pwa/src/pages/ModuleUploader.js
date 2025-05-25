import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../services/firebase'; // Assuming firebase.js is in src/services/
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'; // Corrected to useAuth hook

// Predefined languages - can be fetched from Firestore in a real app
const languages = [
  { id: 'duala', name: 'Duala' },
  { id: 'bassa', name: 'Bassa' },
  { id: 'ewondo', name: 'Ewondo' },
  { id: 'fula', name: 'Fula' },
  { id: 'wolof', name: 'Wolof' },
  { id: 'yoruba', name: 'Yoruba' },
  { id: 'igbo', name: 'Igbo' },
  { id: 'swahili', name: 'Swahili' },
  { id: 'zulu', name: 'Zulu' },
  { id: 'amharic', name: 'Amharic' }
];

const ModuleUploader = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  const [moduleTitle, setModuleTitle] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(languages[0]?.id || ''); // Default to first language
  const [vocabularyEntries, setVocabularyEntries] = useState([
    { id: Date.now(), word: '', translation: '', audioFile: null, audioPreview: '', imageFile: null, imagePreview: '', audioProgress: 0, imageProgress: 0 },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin'); // Redirect if not logged in
      return;
    }
    // Fetch user role
    const fetchUserRole = async () => {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const role = userDocSnap.data().role;
        setUserRole(role);
        if (role !== 'Content Creator' && role !== 'Admin') {
          // console.warn('User does not have permission to access this page.');
          // navigate('/dashboard'); // Or some other appropriate page
          setFormError('You do not have permission to access this page.');
        }
      } else {
        // console.warn('User document not found.');
        // navigate('/dashboard');
        setFormError('User role not found. Access denied.');
      }
    };
    fetchUserRole();
  }, [currentUser, navigate]);

  const handleAddVocabularyEntry = () => {
    setVocabularyEntries([
      ...vocabularyEntries,
      { id: Date.now(), word: '', translation: '', audioFile: null, audioPreview: '', imageFile: null, imagePreview: '', audioProgress: 0, imageProgress: 0 },
    ]);
  };

  const handleRemoveVocabularyEntry = (id) => {
    setVocabularyEntries(vocabularyEntries.filter(entry => entry.id !== id));
  };

  const handleVocabularyChange = (id, field, value) => {
    setVocabularyEntries(
      vocabularyEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleFileChange = (id, fileType, file) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setVocabularyEntries(
        vocabularyEntries.map(entry =>
          entry.id === id
            ? {
                ...entry,
                [fileType === 'audio' ? 'audioFile' : 'imageFile']: file,
                [fileType === 'audio' ? 'audioPreview' : 'imagePreview']: previewUrl,
              }
            : entry
        )
      );
    }
  };

  const uploadFile = (file, path, entryId, fileType) => {
    return new Promise((resolve, reject) => {
      if (!file) resolve(null);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setVocabularyEntries(prevEntries =>
            prevEntries.map(entry =>
              entry.id === entryId
                ? { ...entry, [fileType === 'audio' ? 'audioProgress' : 'imageProgress']: progress }
                : entry
            )
          );
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!moduleTitle.trim() || !targetLanguage) {
      setFormError('Module title and target language are required.');
      return;
    }
    if (vocabularyEntries.some(entry => !entry.word.trim() || !entry.translation.trim())) {
      setFormError('All vocabulary entries must have a word and translation.');
      return;
    }
    if (userRole !== 'Content Creator' && userRole !== 'Admin') {
        setFormError('You do not have permission to perform this action.');
        return;
    }

    setIsUploading(true);

    try {
      const vocabularyData = [];
      for (const entry of vocabularyEntries) {
        let audioUrl = null;
        let imageUrl = null;

        if (entry.audioFile) {
          const audioPath = `language-content/${targetLanguage}/modules/${moduleTitle.replace(/\s+/g, '_').toLowerCase()}/audio/${Date.now()}_${entry.audioFile.name}`;
          audioUrl = await uploadFile(entry.audioFile, audioPath, entry.id, 'audio');
        }
        if (entry.imageFile) {
          const imagePath = `language-content/${targetLanguage}/modules/${moduleTitle.replace(/\s+/g, '_').toLowerCase()}/images/${Date.now()}_${entry.imageFile.name}`;
          imageUrl = await uploadFile(entry.imageFile, imagePath, entry.id, 'image');
        }
        vocabularyData.push({
          word: entry.word,
          translation: entry.translation,
          audioUrl: audioUrl,
          imageUrl: imageUrl,
          // Add any other metadata for vocabulary if needed
        });
      }

      // Save to Firestore
      // Collection: language-content/{languageId}/modules
      // Document: auto-id, with fields: title, vocabulary, createdAt, createdBy, etc.
      const moduleCollectionRef = collection(db, `language-content/${targetLanguage}/modules`);
      await addDoc(moduleCollectionRef, {
        title: moduleTitle,
        // targetLanguage: targetLanguage, // This is part of the path, but can be stored for easier querying if needed
        vocabulary: vocabularyData,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        // Add other module metadata here if needed (e.g., description, order)
      });

      // console.log('Module uploaded successfully!');
      alert('Module uploaded successfully!');
      // Reset form
      setModuleTitle('');
      setTargetLanguage(languages[0]?.id || '');
      setVocabularyEntries([{ id: Date.now(), word: '', translation: '', audioFile: null, audioPreview: '', imageFile: null, imagePreview: '', audioProgress: 0, imageProgress: 0 }]);
      navigate('/creator-dashboard'); // Or to a page showing the new module

    } catch (error) {
      console.error('Error uploading module:', error);
      setFormError('Failed to upload module. ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser || (userRole && userRole !== 'Content Creator' && userRole !== 'Admin' && formError)) {
    return (
        <div className="p-4 sm:p-6 md:p-8 bg-red-100 min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-red-700">Access Denied</h1>
            <p className="text-red-600 mt-2">{formError || 'You do not have permission to view this page.'}</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-marine-blue text-white rounded hover:bg-marine-blue-dark">
                Go to Homepage
            </button>
        </div>
    );
  }
  if (!userRole) {
    return <p className="p-4 text-center">Loading user data...</p>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-sky-50 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-bold text-marine-blue-dark mb-8 text-center">Create New Module</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        {formError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{formError}</p>}

        <div className="mb-6">
          <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
          <input
            type="text"
            id="moduleTitle"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
          <select
            id="targetLanguage"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            required
          >
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        <h2 className="text-xl font-semibold text-marine-blue-dark mb-4 mt-8">Vocabulary Entries</h2>
        {vocabularyEntries.map((entry, index) => (
          <div key={entry.id} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Vocabulary Item #{index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`word-${entry.id}`} className="block text-xs font-medium text-gray-600 mb-1">Word/Phrase</label>
                <input
                  type="text"
                  id={`word-${entry.id}`}
                  value={entry.word}
                  onChange={(e) => handleVocabularyChange(entry.id, 'word', e.target.value)}
                  className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-400 focus:border-sky-400 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor={`translation-${entry.id}`} className="block text-xs font-medium text-gray-600 mb-1">Translation</label>
                <input
                  type="text"
                  id={`translation-${entry.id}`}
                  value={entry.translation}
                  onChange={(e) => handleVocabularyChange(entry.id, 'translation', e.target.value)}
                  className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-400 focus:border-sky-400 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor={`audio-${entry.id}`} className="block text-xs font-medium text-gray-600 mb-1">Audio File</label>
              <input
                type="file"
                id={`audio-${entry.id}`}
                accept="audio/*"
                onChange={(e) => handleFileChange(entry.id, 'audio', e.target.files[0])}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
              />
              {entry.audioPreview && <audio src={entry.audioPreview} controls className="mt-2 w-full" />}
              {entry.audioFile && entry.audioProgress > 0 && entry.audioProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${entry.audioProgress}%` }}></div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor={`image-${entry.id}`} className="block text-xs font-medium text-gray-600 mb-1">Image (Optional)</label>
              <input
                type="file"
                id={`image-${entry.id}`}
                accept="image/*"
                onChange={(e) => handleFileChange(entry.id, 'image', e.target.files[0])}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
              />
              {entry.imagePreview && <img src={entry.imagePreview} alt="Preview" className="mt-2 max-h-32 rounded" />}
              {entry.imageFile && entry.imageProgress > 0 && entry.imageProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${entry.imageProgress}%` }}></div>
                </div>
              )}
            </div>

            {vocabularyEntries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveVocabularyEntry(entry.id)}
                className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Remove Item
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddVocabularyEntry}
          className="mt-4 mb-6 px-4 py-2 border border-dashed border-sky-400 text-sky-600 rounded-md hover:bg-sky-50 transition-colors duration-150 w-full"
        >
          + Add Vocabulary Item
        </button>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isUploading || (userRole !== 'Content Creator' && userRole !== 'Admin')}
            className="px-6 py-2.5 bg-marine-blue text-white font-semibold rounded-md shadow-sm hover:bg-marine-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Module'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleUploader;