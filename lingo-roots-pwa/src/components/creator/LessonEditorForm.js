import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { db, storage } from '../../services/firebase'; // Assuming firebase storage is exported from here
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import FileUploadComponent from '../common/FileUploadComponent'; // Import FileUploadComponent
import './LessonEditorForm.css';

// Validation Schema
const validationSchema = Yup.object().shape({
  title: Yup.string().required('Lesson title is required').min(5, 'Title must be at least 5 characters'),
  textContent: Yup.string().required('Lesson content is required').min(20, 'Content must be at least 20 characters'),
  languageId: Yup.string().required('Language ID is required'),
  // File validation will be handled by FileUploadComponent
});

const LessonEditorForm = ({ lessonId, langId, onFormSubmitSuccess }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!lessonId);
  // State to hold URLs for submission, initialized by existing URLs or updated by FileUploadComponent
  const [imageUrlToSubmit, setImageUrlToSubmit] = useState(null);
  const [audioUrlToSubmit, setAudioUrlToSubmit] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      languageId: langId || '',
    }
  });

  useEffect(() => {
    if (isEditMode && lessonId && langId) {
      const fetchLessonData = async () => {
        setLoading(true);
        try {
          const lessonRef = doc(db, 'languages', langId, 'lessons', lessonId);
          const lessonSnap = await getDoc(lessonRef);
          if (lessonSnap.exists()) {
            const lessonData = lessonSnap.data();
            setValue('title', lessonData.title);
            setValue('textContent', lessonData.textContent);
            setValue('languageId', langId);
            if (lessonData.imageUrl) setImageUrlToSubmit(lessonData.imageUrl);
            if (lessonData.audioUrl) setAudioUrlToSubmit(lessonData.audioUrl);
          } else {
            toast.error('Lesson not found.');
          }
        } catch (error) {
          console.error('Error fetching lesson:', error);
          toast.error('Failed to load lesson data.');
        }
        setLoading(false);
      };
      fetchLessonData();
    } else {
      // For new lessons, ensure URLs are null initially
      setImageUrlToSubmit(null);
      setAudioUrlToSubmit(null);
    }
  }, [isEditMode, lessonId, langId, setValue, navigate]);

  const handleImageUploadSuccess = (url) => {
    setImageUrlToSubmit(url);
    toast.success('Image uploaded and ready to be saved with the lesson.');
  };

  const handleAudioUploadSuccess = (url) => {
    setAudioUrlToSubmit(url);
    toast.success('Audio uploaded and ready to be saved with the lesson.');
  };

  const handleUploadError = (error, fileType) => {
    toast.error(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} upload failed: ${error.message}`);
  };

  const onSubmit = async (data) => {
    if (!currentUser) {
      toast.error('You must be logged in to perform this action.');
      return;
    }
    setLoading(true);

    try {
      const lessonData = {
        title: data.title,
        textContent: data.textContent,
        langId: data.languageId,
        imageUrl: imageUrlToSubmit || null,
        audioUrl: audioUrlToSubmit || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      };

      if (isEditMode) {
        const lessonRef = doc(db, 'languages', data.languageId, 'lessons', lessonId);
        await updateDoc(lessonRef, lessonData);
        toast.success('Lesson updated successfully!');
      } else {
        lessonData.createdAt = serverTimestamp();
        lessonData.createdBy = currentUser.uid;
        lessonData.order = 0; // Default order
        const lessonsCollectionRef = collection(db, 'languages', data.languageId, 'lessons');
        const newLessonRef = await addDoc(lessonsCollectionRef, lessonData);
        toast.success('Lesson created successfully!');
        // Optionally, update state to reflect new lesson ID if staying on page
        // setIsEditMode(true);
        // lessonId = newLessonRef.id; // This won't work directly, need to manage prop/state
      }
      if (onFormSubmitSuccess) onFormSubmitSuccess();
      reset();
      setImageUrlToSubmit(null);
      setAudioUrlToSubmit(null);
      // navigate(`/creator-dashboard/content-management`); // Example navigation

    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(`Failed to save lesson: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !imageUrlToSubmit && !audioUrlToSubmit && lessonId) { // Check lessonId to ensure it's an actual edit load
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading lesson details...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lesson-editor-form bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-marine-blue dark:text-sky-300 mb-6 text-center">
        {isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
      </h2>

      <div>
        <label htmlFor="languageId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language ID</label>
        <input 
          type="text" 
          id="languageId" 
          {...register('languageId')} 
          className={`mt-1 block w-full px-3 py-2 border ${errors.languageId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
          placeholder="e.g., duala, bassa" 
          readOnly={!!langId} // If langId is passed as prop, make it read-only
        />
        {errors.languageId && <p className="mt-1 text-xs text-red-500">{errors.languageId.message}</p>}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson Title</label>
        <input 
          type="text" 
          id="title" 
          {...register('title')} 
          className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
          placeholder="Enter lesson title"
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson Content</label>
        <textarea 
          id="textContent" 
          {...register('textContent')} 
          rows="6"
          className={`mt-1 block w-full px-3 py-2 border ${errors.textContent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
          placeholder="Enter lesson content (text, dialogues, cultural tips...)"
        ></textarea>
        {errors.textContent && <p className="mt-1 text-xs text-red-500">{errors.textContent.message}</p>}
      </div>

      {/* Image Upload using FileUploadComponent */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Image (Optional)</label>
        {imageUrlToSubmit && (
          <div className="my-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current image preview:</p>
            <img src={imageUrlToSubmit} alt="Current lesson" className="max-h-40 rounded-md shadow my-1" />
            <button 
              type="button" 
              onClick={() => setImageUrlToSubmit(null)} 
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Remove Image
            </button>
          </div>
        )}
        {!imageUrlToSubmit && (
          <FileUploadComponent 
            fileType="image"
            onUploadSuccess={handleImageUploadSuccess}
            onUploadError={(err) => handleUploadError(err, 'image')}
            storagePath={`lesson_uploads/${currentUser?.uid || 'guest'}/images`}
            fileNamePrefix={`lesson_${langId || 'anylang'}_${lessonId || Date.now()}_`}
          />
        )}
      </div>

      {/* Audio Upload using FileUploadComponent */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Audio (Optional)</label>
        {audioUrlToSubmit && (
          <div className="my-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current audio:</p>
            <audio controls src={audioUrlToSubmit} className="w-full max-w-xs my-1"></audio>
            <button 
              type="button" 
              onClick={() => setAudioUrlToSubmit(null)} 
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Remove Audio
            </button>
          </div>
        )}
        {!audioUrlToSubmit && (
          <FileUploadComponent 
            fileType="audio"
            onUploadSuccess={handleAudioUploadSuccess}
            onUploadError={(err) => handleUploadError(err, 'audio')}
            storagePath={`lesson_uploads/${currentUser?.uid || 'guest'}/audios`}
            fileNamePrefix={`lesson_${langId || 'anylang'}_${lessonId || Date.now()}_`}
          />
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading} // FileUploadComponent handles its own loading state for uploads
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
      >
        {loading ? 'Saving...' : (isEditMode ? 'Update Lesson' : 'Create Lesson')}
      </button>
    </form>
  );
};

export default LessonEditorForm;