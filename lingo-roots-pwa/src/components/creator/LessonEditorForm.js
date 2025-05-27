import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { db, storage } from '../../services/firebase'; // Assuming firebase storage is exported from here
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '../../context/AuthContext';
import './LessonEditorForm.css'; // We will create this CSS file next

// Validation Schema
const validationSchema = Yup.object().shape({
  title: Yup.string().required('Lesson title is required').min(5, 'Title must be at least 5 characters'),
  textContent: Yup.string().required('Lesson content is required').min(20, 'Content must be at least 20 characters'),
  languageId: Yup.string().required('Language ID is required'), // Assuming this will be passed or selected
  // Optional fields, so no .required()
  imageFile: Yup.mixed().test('fileSize', 'Image file too large, max 2MB', value => {
    return !value || (value && value[0] && value[0].size <= 2 * 1024 * 1024); // 2MB
  }).test('fileType', 'Unsupported image format', value => {
    return !value || (value && value[0] && ['image/jpeg', 'image/png', 'image/gif'].includes(value[0].type));
  }),
  audioFile: Yup.mixed().test('fileSize', 'Audio file too large, max 5MB', value => {
    return !value || (value && value[0] && value[0].size <= 5 * 1024 * 1024); // 5MB
  }).test('fileType', 'Unsupported audio format', value => {
    return !value || (value && value[0] && ['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(value[0].type));
  }),
});

const LessonEditorForm = ({ lessonId, langId, onFormSubmitSuccess }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!lessonId);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ image: 0, audio: 0 });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      languageId: langId || '', // Pre-fill if langId is passed
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
            setValue('languageId', langId); // Ensure langId is set
            if (lessonData.imageUrl) setExistingImageUrl(lessonData.imageUrl);
            if (lessonData.audioUrl) setExistingAudioUrl(lessonData.audioUrl);
          } else {
            toast.error('Lesson not found.');
            // navigate('/creator-dashboard'); // Or some error page
          }
        } catch (error) {
          console.error('Error fetching lesson:', error);
          toast.error('Failed to load lesson data.');
        }
        setLoading(false);
      };
      fetchLessonData();
    }
  }, [isEditMode, lessonId, langId, setValue, navigate]);

  const uploadFile = async (file, type) => {
    if (!file) return null;
    const toastId = toast.loading(`Uploading ${type}...`);
    // Path: lessons/{langId}/{lessonId_or_timestamp}/{filename}
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `lessons/${langId || 'unknown_lang'}/${lessonId || 'new_lesson'}/${type}s/${fileName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [type]: progress }));
          toast.loading(`Uploading ${type}: ${progress.toFixed(0)}%`, { id: toastId });
        },
        (error) => {
          console.error(`Error uploading ${type}:`, error);
          toast.error(`Failed to upload ${type}.`, { id: toastId });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, { id: toastId });
            resolve(downloadURL);
          } catch (error) {
            console.error(`Error getting download URL for ${type}:`, error);
            toast.error(`Failed to get ${type} URL.`, { id: toastId });
            reject(error);
          }
        }
      );
    });
  };

  const onSubmit = async (data) => {
    if (!currentUser) {
      toast.error('You must be logged in to perform this action.');
      return;
    }
    setLoading(true);
    let imageUrl = existingImageUrl;
    let audioUrl = existingAudioUrl;

    try {
      if (data.imageFile && data.imageFile[0]) {
        imageUrl = await uploadFile(data.imageFile[0], 'image');
      }
      if (data.audioFile && data.audioFile[0]) {
        audioUrl = await uploadFile(data.audioFile[0], 'audio');
      }

      const lessonData = {
        title: data.title,
        textContent: data.textContent,
        langId: data.languageId, // Ensure languageId is part of the data
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
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
        lessonData.order = 0; // Default order, might need a better system
        const lessonsCollectionRef = collection(db, 'languages', data.languageId, 'lessons');
        const newLessonRef = await addDoc(lessonsCollectionRef, lessonData);
        toast.success('Lesson created successfully!');
        // Update state for edit mode if needed, or navigate
        // setIsEditMode(true); // If staying on the page
        // setLessonId(newLessonRef.id); // If staying on the page
      }
      if (onFormSubmitSuccess) onFormSubmitSuccess();
      reset(); // Reset form fields
      setExistingImageUrl(null);
      setExistingAudioUrl(null);
      // navigate(`/creator-dashboard/lessons/${data.languageId}`); // Navigate to lesson list or dashboard

    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(`Failed to save lesson: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress({ image: 0, audio: 0 });
    }
  };

  if (loading && isEditMode && !existingImageUrl && !existingAudioUrl) { // Initial load for edit mode
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

      {/* Image Upload */}
      <div className="space-y-1">
        <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Image (Optional)</label>
        {existingImageUrl && (
          <div className="my-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current image:</p>
            <img src={existingImageUrl} alt="Current lesson" className="max-h-40 rounded-md shadow" />
            <button type="button" onClick={() => { setExistingImageUrl(null); setValue('imageFile', null); }} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove current image</button>
          </div>
        )}
        {!existingImageUrl && (
          <input 
            type="file" 
            id="imageFile" 
            {...register('imageFile')} 
            accept="image/png, image/jpeg, image/gif"
            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 dark:file:bg-sky-700 file:text-sky-700 dark:file:text-sky-100 hover:file:bg-sky-100 dark:hover:file:bg-sky-600 ${errors.imageFile ? 'border-red-500 ring-red-500' : ''}`}
          />
        )}
        {uploadProgress.image > 0 && uploadProgress.image < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
            <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${uploadProgress.image}%` }}></div>
          </div>
        )}
        {errors.imageFile && <p className="mt-1 text-xs text-red-500">{errors.imageFile.message}</p>}
      </div>

      {/* Audio Upload */}
      <div className="space-y-1">
        <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Audio (Optional)</label>
        {existingAudioUrl && (
          <div className="my-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current audio:</p>
            <audio controls src={existingAudioUrl} className="w-full max-w-xs"></audio>
            <button type="button" onClick={() => { setExistingAudioUrl(null); setValue('audioFile', null); }} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove current audio</button>
          </div>
        )}
        {!existingAudioUrl && (
          <input 
            type="file" 
            id="audioFile" 
            {...register('audioFile')} 
            accept="audio/mpeg, audio/wav, audio/ogg"
            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 dark:file:bg-sky-700 file:text-sky-700 dark:file:text-sky-100 hover:file:bg-sky-100 dark:hover:file:bg-sky-600 ${errors.audioFile ? 'border-red-500 ring-red-500' : ''}`}
          />
        )}
        {uploadProgress.audio > 0 && uploadProgress.audio < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
            <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${uploadProgress.audio}%` }}></div>
          </div>
        )}
        {errors.audioFile && <p className="mt-1 text-xs text-red-500">{errors.audioFile.message}</p>}
      </div>

      <button 
        type="submit" 
        disabled={loading || uploadProgress.image > 0 && uploadProgress.image < 100 || uploadProgress.audio > 0 && uploadProgress.audio < 100}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
      >
        {loading ? 'Saving...' : (isEditMode ? 'Update Lesson' : 'Create Lesson')}
      </button>
    </form>
  );
};

export default LessonEditorForm;