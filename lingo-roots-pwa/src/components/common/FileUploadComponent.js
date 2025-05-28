import React, { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase'; // Adjust path as per your project structure
import PropTypes from 'prop-types';

// Default restrictions (can be overridden by props)
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

const FileUploadComponent = ({ 
  onUploadSuccess, 
  onUploadError,
  fileType = 'image', // 'image' or 'audio'
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  storagePath = 'uploads/', // Base path in Firebase Storage
  fileNamePrefix = '' // Optional prefix for the uploaded file name
}) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const currentAcceptedTypes = acceptedFileTypes[fileType] || [];
      if (!currentAcceptedTypes.includes(selectedFile.type)) {
        setError(`Invalid file type. Please select a ${fileType} (${currentAcceptedTypes.join(', ')}).`);
        setFile(null);
        return;
      }

      // Validate file size
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setDownloadURL('');
      setUploadProgress(0);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    const uniqueFileName = `${fileNamePrefix}${Date.now()}-${file.name}`;
    const fullStoragePath = `${storagePath.endsWith('/') ? storagePath : storagePath + '/'}${fileType}s/${uniqueFileName}`;
    const storageRef = ref(storage, fullStoragePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (uploadError) => {
        console.error('Upload failed:', uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setIsUploading(false);
        if (onUploadError) onUploadError(uploadError);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setDownloadURL(url);
          setIsUploading(false);
          setFile(null); // Clear file input after successful upload
          if (onUploadSuccess) onUploadSuccess(url, fullStoragePath, file.type, file.name);
          console.log('File available at', url);
        } catch (getUrlError) {
          console.error('Failed to get download URL:', getUrlError);
          setError(`Failed to get download URL: ${getUrlError.message}`);
          setIsUploading(false);
          if (onUploadError) onUploadError(getUrlError);
        }
      }
    );
  }, [file, fileType, onUploadSuccess, onUploadError, storagePath, fileNamePrefix]);

  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
      <label htmlFor={`file-upload-${fileType}`} className="block text-sm font-medium text-gray-700 mb-1">
        Upload {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
      </label>
      <input 
        id={`file-upload-${fileType}`}
        type="file" 
        onChange={handleFileChange} 
        accept={(acceptedFileTypes[fileType] || []).join(',')}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
        disabled={isUploading}
      />
      
      {file && !isUploading && (
        <button 
          onClick={handleUpload} 
          className="mt-3 px-4 py-2 bg-marine-blue-500 text-white text-sm font-medium rounded-md hover:bg-marine-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue-500 transition duration-150 ease-in-out disabled:bg-gray-300"
          disabled={isUploading}
        >
          Upload {file.name}
        </button>
      )}

      {isUploading && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          >
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {downloadURL && !isUploading && (
        <div className="mt-3 p-2 border border-green-300 bg-green-50 rounded-md">
          <p className="text-sm text-green-700">Upload successful!</p>
          {fileType === 'image' && <img src={downloadURL} alt="Uploaded preview" className="mt-2 max-w-xs max-h-40 rounded" />}
          {fileType === 'audio' && <audio controls src={downloadURL} className="mt-2 w-full">Your browser does not support the audio element.</audio>}
          <p className="text-xs text-gray-500 mt-1 break-all">URL: <a href={downloadURL} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{downloadURL}</a></p>
        </div>
      )}
    </div>
  );
};

FileUploadComponent.propTypes = {
  onUploadSuccess: PropTypes.func.isRequired,
  onUploadError: PropTypes.func,
  fileType: PropTypes.oneOf(['image', 'audio']).isRequired,
  maxSizeMB: PropTypes.number,
  acceptedFileTypes: PropTypes.object,
  storagePath: PropTypes.string, // e.g., 'lessons/images/' or 'quizzes/audio/'
  fileNamePrefix: PropTypes.string, // e.g., 'lessonId_'
};

export default FileUploadComponent;