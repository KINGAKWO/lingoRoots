import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import QuizEditorForm from '../QuizEditorForm';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  collection: jest.fn((db, path) => ({
    path: path, // Store path for easier assertion or conditional mocking
    withConverter: jest.fn().mockReturnThis(),
  })),
}));

// Mock firebase services (db, storage)
jest.mock('../../../services/firebase', () => ({
  db: jest.fn(),
  storage: jest.fn(),
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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ quizId: undefined, langId: undefined }), 
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

describe('QuizEditorForm', () => {
  const providerProps = { currentUser: mockCurrentUser };

  beforeEach(() => {
    jest.clearAllMocks();
    getDoc.mockResolvedValue({ exists: () => false }); // Default: quiz not found
    getDocs.mockResolvedValue({ docs: [] }); // Default: no questions for quiz
    addDoc.mockResolvedValue({ id: 'new-quiz-id' });
    updateDoc.mockResolvedValue();
    setDoc.mockResolvedValue();
  });

  test('renders create mode correctly', () => {
    renderWithContext(<QuizEditorForm langId="test-lang" />, { providerProps });
    expect(screen.getByText(/Create New Quiz/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Language ID/i)).toHaveValue('test-lang');
    expect(screen.getByLabelText(/Language ID/i)).toBeDisabled();
    expect(screen.getByLabelText(/Quiz Title/i)).toBeInTheDocument();
    expect(screen.getByText('Mock FileUploadComponent for image')).toBeInTheDocument();
    expect(screen.getByText('Mock FileUploadComponent for audio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Multiple-Choice Question/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add True\/False Question/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Quiz/i })).toBeInTheDocument();
  });

  test('renders edit mode and loads quiz and question data', async () => {
    const mockQuizData = { title: 'Existing Quiz', imageUrl: 'quiz.jpg', audioUrl: 'quiz.mp3' };
    const mockQuestionsData = [
      { id: 'q1', text: 'MC Question 1', type: 'multiple-choice', options: [{text: 'Opt1', isCorrect: true}, {text: 'Opt2', isCorrect: false}] },
      { id: 'q2', text: 'TF Question 1', type: 'true-false', correctAnswer: true },
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockQuizData });
    getDocs.mockResolvedValue({ docs: mockQuestionsData.map(q => ({ id: q.id, data: () => q })) });

    renderWithContext(<QuizEditorForm quizId="edit-id" langId="edit-lang" />, { providerProps });

    expect(screen.getByText(/Loading quiz details.../i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading quiz details.../i)).not.toBeInTheDocument());

    expect(screen.getByText(/Edit Quiz/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quiz Title/i)).toHaveValue('Existing Quiz');
    expect(screen.getByLabelText(/Language ID/i)).toHaveValue('edit-lang');
    expect(screen.getByAltText('mock image')).toHaveAttribute('src', 'quiz.jpg');
    expect(screen.getByAltText('mock audio')).toHaveAttribute('src', 'quiz.mp3');
    
    // Check for loaded questions
    expect(screen.getByDisplayValue('MC Question 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TF Question 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test('shows error if quiz not found in edit mode', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    renderWithContext(<QuizEditorForm quizId="non-existent" langId="any" />, { providerProps });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Quiz not found.'));
  });

  test('validates required fields (title, at least one question)', async () => {
    renderWithContext(<QuizEditorForm langId="valid-lang" />, { providerProps });
    fireEvent.click(screen.getByRole('button', { name: /Create Quiz/i }));

    await waitFor(() => {
      expect(screen.getByText('Quiz title is required')).toBeInTheDocument();
      expect(screen.getByText('A quiz must have at least one question')).toBeInTheDocument();
    });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test('adds and removes a multiple-choice question', async () => {
    renderWithContext(<QuizEditorForm langId="mc-lang" />, { providerProps });
    fireEvent.click(screen.getByRole('button', { name: /Add Multiple-Choice Question/i }));
    
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    expect(screen.getByLabelText(/Question 1 Text/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Option Text/i).length).toBe(2); // Default 2 options

    // Find the remove button within the question block
    const questionBlock = screen.getByText('Question 1').closest('div.question-block');
    const removeButton = within(questionBlock).getByRole('button', { name: /Remove Question/i });
    fireEvent.click(removeButton);

    await waitFor(() => expect(screen.queryByText('Question 1')).not.toBeInTheDocument());
  });

  test('adds and removes a true/false question', async () => {
    renderWithContext(<QuizEditorForm langId="tf-lang" />, { providerProps });
    fireEvent.click(screen.getByRole('button', { name: /Add True\/False Question/i }));

    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    expect(screen.getByLabelText(/Question 1 Text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correct Answer:/i)).toBeInTheDocument(); // For T/F

    const questionBlock = screen.getByText('Question 1').closest('div.question-block');
    const removeButton = within(questionBlock).getByRole('button', { name: /Remove Question/i });
    fireEvent.click(removeButton);

    await waitFor(() => expect(screen.queryByText('Question 1')).not.toBeInTheDocument());
  });

  test('validates multiple-choice question options (min 2, at least one correct)', async () => {
    renderWithContext(<QuizEditorForm langId="mc-valid-lang" />, { providerProps });
    fireEvent.change(screen.getByLabelText(/Quiz Title/i), { target: { value: 'Test Quiz Title' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Multiple-Choice Question/i }));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());

    const questionText = screen.getByLabelText(/Question 1 Text/i);
    fireEvent.change(questionText, { target: { value: 'Sample MC Question' } });

    // Try to submit without correct option
    fireEvent.click(screen.getByRole('button', { name: /Create Quiz/i }));
    await waitFor(() => {
        expect(screen.getByText('At least one option must be correct')).toBeInTheDocument();
    });

    // Mark one option as correct
    const correctCheckboxes = screen.getAllByLabelText(/Correct\?/i);
    fireEvent.click(correctCheckboxes[0]); // Mark first option as correct
    
    // Fill option texts
    const optionTexts = screen.getAllByLabelText(/Option Text/i);
    fireEvent.change(optionTexts[0], {target: {value: 'Correct Opt'}});
    fireEvent.change(optionTexts[1], {target: {value: 'Incorrect Opt'}});

    // Now validation should pass for this question (if other fields are fine)
    fireEvent.click(screen.getByRole('button', { name: /Create Quiz/i }));
    await waitFor(() => {
        expect(screen.queryByText('At least one option must be correct')).not.toBeInTheDocument();
        // It should now call addDoc if title and question text are filled
        expect(addDoc).toHaveBeenCalled(); 
    });
  });

  test('submits new quiz data with questions correctly', async () => {
    const onFormSubmitSuccessMock = jest.fn();
    renderWithContext(<QuizEditorForm langId="new-quiz-lang" onFormSubmitSuccess={onFormSubmitSuccessMock} />, { providerProps });

    fireEvent.change(screen.getByLabelText(/Quiz Title/i), { target: { value: 'My Awesome Quiz' } });
    
    // Add MC Question
    fireEvent.click(screen.getByRole('button', { name: /Add Multiple-Choice Question/i }));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Question 1 Text/i), { target: { value: 'What is 2+2?' } });
    const mcOptions = screen.getAllByLabelText(/Option Text/i);
    fireEvent.change(mcOptions[0], { target: { value: '4' } });
    fireEvent.change(mcOptions[1], { target: { value: '3' } });
    fireEvent.click(screen.getAllByLabelText(/Correct\?/i)[0]); // Mark '4' as correct

    // Add TF Question
    fireEvent.click(screen.getByRole('button', { name: /Add True\/False Question/i }));
    await waitFor(() => expect(screen.getByText('Question 2')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Question 2 Text/i), { target: { value: 'Is sky blue?' } });
    // Default for True/False is True, let's keep it

    // Simulate file uploads
    fireEvent.click(screen.getAllByText('Simulate image Upload')[0]);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Image uploaded for quiz.'));

    fireEvent.click(screen.getByRole('button', { name: /Create Quiz/i }));

    await waitFor(() => expect(addDoc).toHaveBeenCalledTimes(1)); // For the quiz itself
    expect(addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'languages/new-quiz-lang/quizzes' }),
      expect.objectContaining({
        title: 'My Awesome Quiz',
        langId: 'new-quiz-lang',
        imageUrl: 'mock-image-url.com',
        audioUrl: null, // Audio not uploaded in this test
        createdBy: mockCurrentUser.uid,
      })
    );
    
    // Check setDoc for questions (called twice, once for each question)
    await waitFor(() => expect(setDoc).toHaveBeenCalledTimes(2)); 
    expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'languages/new-quiz-lang/quizzes/new-quiz-id/questions' }), // Path for first question
        expect.objectContaining({ text: 'What is 2+2?', type: 'multiple-choice', options: expect.any(Array) })
    );
    expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'languages/new-quiz-lang/quizzes/new-quiz-id/questions' }), // Path for second question
        expect.objectContaining({ text: 'Is sky blue?', type: 'true-false', correctAnswer: true })
    );

    expect(toast.success).toHaveBeenCalledWith('Quiz created successfully!');
    expect(onFormSubmitSuccessMock).toHaveBeenCalledWith('new-quiz-id');
  });

  test('submits updated quiz data with questions correctly', async () => {
    const mockExistingQuiz = { title: 'Old Quiz Title', imageUrl: null, audioUrl: null };
    const mockExistingQuestions = [
        { id: 'qExist1', text: 'Old MC Question', type: 'multiple-choice', options: [{text: 'OldOpt', isCorrect: true}] }
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockExistingQuiz });
    getDocs.mockResolvedValue({ docs: mockExistingQuestions.map(q => ({ id: q.id, data: () => q })) });
    const onFormSubmitSuccessMock = jest.fn();

    renderWithContext(<QuizEditorForm quizId="update-quiz-id" langId="update-lang" onFormSubmitSuccess={onFormSubmitSuccessMock} />, { providerProps });
    await waitFor(() => expect(screen.queryByText(/Loading quiz details.../i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Quiz Title/i), { target: { value: 'Updated Quiz Title!' } });
    // Update existing question text
    fireEvent.change(screen.getByDisplayValue('Old MC Question'), { target: { value: 'Updated MC Question Text!' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(1)); // For the quiz doc
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(), // quiz doc ref
      expect.objectContaining({ title: 'Updated Quiz Title!' })
    );

    await waitFor(() => expect(setDoc).toHaveBeenCalledTimes(1)); // For the updated question
    expect(setDoc).toHaveBeenCalledWith(
      doc(db, 'languages', 'update-lang', 'quizzes', 'update-quiz-id', 'questions', 'qExist1'),
      expect.objectContaining({ text: 'Updated MC Question Text!' })
    );
    expect(toast.success).toHaveBeenCalledWith('Quiz updated successfully!');
    expect(onFormSubmitSuccessMock).toHaveBeenCalledWith('update-quiz-id');
  });

  // Add more tests: file upload errors, auth errors, Firestore save errors, removing options from MC, etc.
});