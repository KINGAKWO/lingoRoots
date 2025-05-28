import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LessonEditorForm from '../LessonEditorForm';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../services/firebase'; // Assuming storage is also mocked via this
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'), // Mock serverTimestamp
  collection: jest.fn(),
}));

// Mock firebase services (db, storage)
jest.mock('../../../services/firebase', () => ({
  db: jest.fn(),
  storage: jest.fn(), // Mock storage if FileUploadComponent uses it directly
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock FileUploadComponent
jest.mock('../../common/FileUploadComponent', () => {
  return jest.fn(({ onUploadSuccess, onUploadError, fileType, currentFileUrl, onRemoveFile }) => (
    <div>
      <p>Mock FileUploadComponent for {fileType}</p>
      {currentFileUrl && <img src={currentFileUrl} alt={`mock ${fileType}`} />}
      <button onClick={() => onUploadSuccess(`mock-${fileType}-url.com`)}>Simulate {fileType} Upload</button>
      <button onClick={() => onUploadError(new Error(`mock ${fileType} error`), fileType)}>Simulate {fileType} Error</button>
      {currentFileUrl && <button onClick={onRemoveFile}>Simulate Remove {fileType}</button>}
    </div>
  ));
});

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ lessonId: undefined, langId: undefined }), // Default mock for useParams
}));

const mockCurrentUser = { uid: 'test-user-id' };

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider value={providerProps}>
      <Router>{ui}</Router>
    </AuthContext.Provider>,
    renderOptions
  );
};

describe('LessonEditorForm', () => {
  const providerProps = { currentUser: mockCurrentUser };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for getDoc (lesson not found)
    getDoc.mockResolvedValue({ exists: () => false });
    addDoc.mockResolvedValue({ id: 'new-lesson-id' });
    updateDoc.mockResolvedValue();
  });

  test('renders create mode correctly', () => {
    renderWithContext(<LessonEditorForm langId="test-lang" />, { providerProps });
    expect(screen.getByText(/Create New Lesson/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Language ID/i)).toHaveValue('test-lang');
    expect(screen.getByLabelText(/Language ID/i)).toBeDisabled();
    expect(screen.getByLabelText(/Lesson Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lesson Content/i)).toBeInTheDocument();
    expect(screen.getByText('Mock FileUploadComponent for image')).toBeInTheDocument();
    expect(screen.getByText('Mock FileUploadComponent for audio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Lesson/i })).toBeInTheDocument();
  });

  test('renders edit mode and loads data', async () => {
    const mockLessonData = {
      title: 'Existing Lesson', 
      textContent: 'Some content here.', 
      imageUrl: 'existing-image.jpg', 
      audioUrl: 'existing-audio.mp3'
    };
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockLessonData });

    renderWithContext(<LessonEditorForm lessonId="edit-id" langId="edit-lang" />, { providerProps });

    expect(screen.getByText(/Loading lesson details.../i)).toBeInTheDocument(); 
    await waitFor(() => expect(screen.queryByText(/Loading lesson details.../i)).not.toBeInTheDocument());
    
    expect(screen.getByText(/Edit Lesson/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Language ID/i)).toHaveValue('edit-lang');
    expect(screen.getByLabelText(/Lesson Title/i)).toHaveValue('Existing Lesson');
    expect(screen.getByLabelText(/Lesson Content/i)).toHaveValue('Some content here.');
    // Check if FileUploadComponent receives existing URLs (via its mock)
    expect(screen.getByAltText('mock image')).toHaveAttribute('src', 'existing-image.jpg');
    expect(screen.getByAltText('mock audio')).toHaveAttribute('src', 'existing-audio.mp3');
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test('shows error if lesson not found in edit mode', async () => {
    getDoc.mockResolvedValue({ exists: () => false }); // Simulate lesson not found
    renderWithContext(<LessonEditorForm lessonId="non-existent-id" langId="any-lang" />, { providerProps });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Lesson not found.'));
  });

  test('validates required fields on submit', async () => {
    renderWithContext(<LessonEditorForm langId="test-lang" />, { providerProps });
    fireEvent.click(screen.getByRole('button', { name: /Create Lesson/i }));

    await waitFor(() => {
      expect(screen.getByText('Lesson title is required')).toBeInTheDocument();
      expect(screen.getByText('Lesson content is required')).toBeInTheDocument();
    });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test('submits new lesson data correctly', async () => {
    renderWithContext(<LessonEditorForm langId="new-lang" onFormSubmitSuccess={jest.fn()} />, { providerProps });

    fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'New Awesome Lesson' } });
    fireEvent.change(screen.getByLabelText(/Lesson Content/i), { target: { value: 'This is the content for the new awesome lesson, long enough.' } });
    
    // Simulate file uploads
    const imageUploadButton = screen.getAllByText('Simulate image Upload')[0];
    fireEvent.click(imageUploadButton);
    const audioUploadButton = screen.getAllByText('Simulate audio Upload')[0];
    fireEvent.click(audioUploadButton);

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Image uploaded and ready to be saved with the lesson.');
        expect(toast.success).toHaveBeenCalledWith('Audio uploaded and ready to be saved with the lesson.');
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Lesson/i }));

    await waitFor(() => expect(addDoc).toHaveBeenCalledTimes(1));
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(), // collection ref
      {
        title: 'New Awesome Lesson',
        textContent: 'This is the content for the new awesome lesson, long enough.',
        langId: 'new-lang',
        imageUrl: 'mock-image-url.com',
        audioUrl: 'mock-audio-url.com',
        createdAt: 'mock-timestamp',
        createdBy: mockCurrentUser.uid,
        updatedAt: 'mock-timestamp',
        updatedBy: mockCurrentUser.uid,
        order: 0,
      }
    );
    expect(toast.success).toHaveBeenCalledWith('Lesson created successfully!');
  });

  test('submits updated lesson data correctly', async () => {
    const mockExistingData = { title: 'Old Title', textContent: 'Old Content', imageUrl: null, audioUrl: null }; 
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockExistingData });
    const onFormSubmitSuccessMock = jest.fn();

    renderWithContext(<LessonEditorForm lessonId="update-id" langId="update-lang" onFormSubmitSuccess={onFormSubmitSuccessMock} />, { providerProps });
    await waitFor(() => expect(screen.queryByText(/Loading lesson details.../i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'Updated Lesson Title' } });
    fireEvent.change(screen.getByLabelText(/Lesson Content/i), { target: { value: 'Updated lesson content, which is sufficiently long.' } });
    
    // Simulate removing an existing image (if any) and uploading a new one
    // For this test, let's assume no initial image, then upload one.
    const imageUploadButton = screen.getAllByText('Simulate image Upload')[0];
    fireEvent.click(imageUploadButton);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Image uploaded and ready to be saved with the lesson.'));

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(1));
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(), // doc ref
      {
        title: 'Updated Lesson Title',
        textContent: 'Updated lesson content, which is sufficiently long.',
        langId: 'update-lang',
        imageUrl: 'mock-image-url.com', // From simulated upload
        audioUrl: null, // Assuming audio wasn't changed or uploaded
        updatedAt: 'mock-timestamp',
        updatedBy: mockCurrentUser.uid,
      }
    );
    expect(toast.success).toHaveBeenCalledWith('Lesson updated successfully!');
    expect(onFormSubmitSuccessMock).toHaveBeenCalled();
  });

  test('handles image removal', async () => {
    const mockLessonDataWithImage = {
      title: 'Lesson With Image', 
      textContent: 'Content.', 
      imageUrl: 'initial-image.jpg', 
      audioUrl: null
    };
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockLessonDataWithImage });
    renderWithContext(<LessonEditorForm lessonId="img-test-id" langId="img-lang" />, { providerProps });
    await waitFor(() => expect(screen.getByAltText('mock image')).toBeInTheDocument());

    const removeImageButton = screen.getByText('Simulate Remove image');
    fireEvent.click(removeImageButton);

    // Check that the FileUploadComponent is now ready for a new upload (no currentFileUrl)
    // This depends on how FileUploadComponent re-renders after removal.
    // For this mock, we'd expect the image to disappear.
    await waitFor(() => expect(screen.queryByAltText('mock image')).not.toBeInTheDocument());

    // Submit the form and check if imageUrl is null
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ imageUrl: null })
    ));
  });

  test('handles file upload error', async () => {
    renderWithContext(<LessonEditorForm langId="error-lang" />, { providerProps });
    const imageErrorButton = screen.getAllByText('Simulate image Error')[0];
    fireEvent.click(imageErrorButton);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Image upload failed: mock image error'));
  });

  test('requires login to submit', async () => {
    renderWithContext(<LessonEditorForm langId="auth-lang" />, { providerProps: { currentUser: null } }); // No user

    fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'Attempt Title' } });
    fireEvent.change(screen.getByLabelText(/Lesson Content/i), { target: { value: 'Attempt content, long enough for validation.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Lesson/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You must be logged in to perform this action.'));
    expect(addDoc).not.toHaveBeenCalled();
  });

  test('handles submission error from Firestore', async () => {
    addDoc.mockRejectedValueOnce(new Error('Firestore save failed'));
    renderWithContext(<LessonEditorForm langId="submit-err-lang" />, { providerProps });

    fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'Error Case Title' } });
    fireEvent.change(screen.getByLabelText(/Lesson Content/i), { target: { value: 'Error case content, also long enough for validation.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Lesson/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save lesson: Firestore save failed'));
  });
});