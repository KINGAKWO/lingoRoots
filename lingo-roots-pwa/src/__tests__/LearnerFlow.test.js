import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter as Router, MemoryRouter, Routes, Route } from 'react-router-dom';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Components to test
import LessonListPage from '../pages/LessonListPage';
import QuizViewComponent from '../pages/quiz/QuizViewComponent';
import FlashcardTrainerComponent from '../pages/flashcards/FlashcardTrainerComponent';
import UserProfilePage from '../pages/user/UserProfilePage'; // Assuming this might be part of the flow
import { AuthContext } from '../context/AuthContext';

const PROJECT_ID = 'lingo-roots-pwa-test'; // Your Firebase project ID for testing
let testEnv;

// Helper to get Firestore instance for a specific user
const getFirestore = (auth) => {
  return testEnv.authenticatedContext(auth ? auth.uid : null, auth ? { email: auth.email } : {}).firestore();
};

// Mock user data
const mockLearnerUser = {
  uid: 'testLearnerUser123',
  email: 'learner@example.com',
  displayName: 'Test Learner',
  role: 'learner',
  selectedLanguages: ['testLang1'],
  activeLearningLanguage: 'testLang1',
};

// Mock data
const mockLanguages = [
  { id: 'testLang1', name: 'Test Language 1', flagEmoji: '🧪' },
  { id: 'testLang2', name: 'Test Language 2', flagEmoji: '🔬' },
];

const mockLessons = {
  testLang1: [
    { id: 'lesson1', title: 'Lesson 1: Basics', description: 'Introduction to Test Language 1', order: 1 },
    { id: 'lesson2', title: 'Lesson 2: Advanced', description: 'Advanced topics', order: 2 },
  ],
};

const mockQuizzes = {
  testLang1: [
    { id: 'quiz1', title: 'General Knowledge Quiz', description: 'Test your general knowledge for Test Language 1.', lessonId: 'lesson1', order: 1, totalQuestions: 2, totalPossibleScore: 20 },
  ],
};

const mockQuizQuestions = {
  quiz1: [ // Corresponds to quizId 'quiz1'
    { id: 'q1', text: 'What is 1+1?', options: ['1', '2', '3'], correctAnswer: '2', order: 1, points: 10 },
    { id: 'q2', text: 'What is the capital of Testland?', options: ['Testville', 'Testburg', 'Test City'], correctAnswer: 'Test City', order: 2, points: 10 },
  ],
};

const mockFlashcards = {
  testLang1: {
    lesson1: [
      { id: 'fc1', front: 'Hello', back: 'Bonjour (Test)', order: 1 },
      { id: 'fc2', front: 'Goodbye', back: 'Au Revoir (Test)', order: 2 },
    ],
  },
};

// Helper to seed data
const seedData = async (db) => {
  // Seed languages
  for (const lang of mockLanguages) {
    await setDoc(doc(db, 'languages', lang.id), lang);
  }

  // Seed lessons
  for (const langId in mockLessons) {
    for (const lesson of mockLessons[langId]) {
      await setDoc(doc(db, `languages/${langId}/lessons`, lesson.id), lesson);
      // Seed quizzes (now directly under language, not lesson subcollection for this test setup)
      if (mockQuizzes[langId]) {
        for (const quiz of mockQuizzes[langId]) {
          // Ensure quiz data matches what QuizViewComponent might expect (e.g., title, description)
          const quizDocData = { 
            title: quiz.title,
            description: quiz.description,
            order: quiz.order,
            lessonId: quiz.lessonId, // Keep lessonId if it's used for linking/display elsewhere
            // Add any other fields QuizViewComponent might fetch for metadata
          };
          await setDoc(doc(db, `languages/${langId}/quizzes`, quiz.id), quizDocData);

          // Seed questions for this quiz
          if (mockQuizQuestions[quiz.id]) {
            for (const q of mockQuizQuestions[quiz.id]) {
              await setDoc(doc(db, `languages/${langId}/quizzes/${quiz.id}/questions`, q.id), q);
            }
          }
        }
      }
      // Seed flashcards for this lesson
      if (mockFlashcards[langId] && mockFlashcards[langId][lesson.id]) {
        for (const fc of mockFlashcards[langId][lesson.id]) {
          await setDoc(doc(db, `languages/${langId}/lessons/${lesson.id}/flashcards`, fc.id), fc);
        }
      }
    }
  }
  // Seed user data (especially selected language)
  await setDoc(doc(db, 'users', mockLearnerUser.uid), {
    displayName: mockLearnerUser.displayName,
    email: mockLearnerUser.email,
    role: mockLearnerUser.role,
    selectedLanguages: mockLearnerUser.selectedLanguages,
    activeLearningLanguage: mockLearnerUser.activeLearningLanguage,
    createdAt: serverTimestamp(),
  });
};

// Mock AuthProvider
const MockAuthProvider = ({ children, currentUser }) => (
  <AuthContext.Provider value={{ currentUser, loading: false, signInWithGoogle: jest.fn(), signOutUser: jest.fn() }}>
    {children}
  </AuthContext.Provider>
);

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../../../firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080, // Default Firestore emulator port
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('Learner Flow Integration Tests', () => {
  // Test for fetching and displaying lessons
  test('LessonListPage: should fetch and display lessons for the selected language', async () => {
    const db = getFirestore(mockLearnerUser);
    await seedData(db);

    render(
      <MockAuthProvider currentUser={mockLearnerUser}>
        <MemoryRouter initialEntries={['/lessons']}>
          <Routes>
            <Route path="/lessons" element={<LessonListPage />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );

    await waitFor(() => {
      const expectedLangName = mockLanguages.find(l => l.id === mockLearnerUser.activeLearningLanguage)?.name || mockLearnerUser.activeLearningLanguage;
      // LessonListPage capitalizes the langId if name is not directly available from user doc or a lang context
      // For this test, it uses langId 'testLang1', which becomes 'TestLang1'
      expect(screen.getByText(`Lessons for ${mockLearnerUser.activeLearningLanguage.charAt(0).toUpperCase() + mockLearnerUser.activeLearningLanguage.slice(1)}`)).toBeInTheDocument();
    });

    // Check if lesson titles are displayed
    expect(screen.getByText('Lesson 1: Basics')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2: Advanced')).toBeInTheDocument();
  });

  // Test for fetching, displaying, and submitting a quiz
  test('QuizViewComponent: should fetch quiz, allow answering, submit, and store progress', async () => {
    const db = getFirestore(mockLearnerUser);
    await seedData(db);

    const langId = 'testLang1';
    const quizId = 'quiz1'; // From mockQuizzes

    render(
      <MockAuthProvider currentUser={mockLearnerUser}>
        <MemoryRouter initialEntries={[`/quiz/${langId}/${quizId}`]}>
          <Routes>
            <Route path="/quiz/:langId/:quizId" element={<QuizViewComponent />} />
            {/* Add a dummy route for navigation after quiz completion if needed */}
            <Route path="/lessons/:langId" element={<div>Mock Lessons Page</div>} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );

    // 1. Wait for quiz metadata and first question to load
    await waitFor(() => {
      expect(screen.getByText(mockQuizzes[langId][0].title)).toBeInTheDocument(); // Quiz title
      expect(screen.getByText(mockQuizQuestions[quizId][0].text)).toBeInTheDocument(); // First question text
    });

    // 2. Answer first question
    const firstQuestionOptions = mockQuizQuestions[quizId][0].options;
    const firstCorrectAnswer = mockQuizQuestions[quizId][0].correctAnswer;
    // Click the radio button corresponding to the correct answer for the first question
    // Assuming options are rendered as radio buttons with their text as labels or values
    fireEvent.click(screen.getByLabelText(firstCorrectAnswer));
    
    // Check if the "Next Question" button is enabled (or "Submit Quiz" if only one question)
    let nextButton = screen.getByRole('button', { name: mockQuizQuestions[quizId].length > 1 ? 'Next Question' : 'Submit Quiz' });
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    // 3. Answer second question
    await waitFor(() => {
      expect(screen.getByText(mockQuizQuestions[quizId][1].text)).toBeInTheDocument(); // Second question text
    });
    const secondQuestionOptions = mockQuizQuestions[quizId][1].options;
    const secondCorrectAnswer = mockQuizQuestions[quizId][1].correctAnswer;
    fireEvent.click(screen.getByLabelText(secondCorrectAnswer));

    // 4. Submit quiz
    const submitButton = screen.getByRole('button', { name: 'Submit Quiz' });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    // 5. Verify score display
    const expectedScore = mockQuizQuestions[quizId][0].points + mockQuizQuestions[quizId][1].points;
    const totalPossibleScore = mockQuizQuestions[quizId].reduce((sum, q) => sum + q.points, 0);
    await waitFor(() => {
      expect(screen.getByText('Quiz Completed!')).toBeInTheDocument();
      expect(screen.getByText(`Your Score: ${expectedScore} / ${totalPossibleScore}`)).toBeInTheDocument();
    });

    // 6. Verify progress stored in Firestore
    const userProgressRef = doc(db, 'users', mockLearnerUser.uid, 'userProgress', quizId);
    const userProgressSnap = await assertSucceeds(getDoc(userProgressRef));
    expect(userProgressSnap.exists()).toBe(true);
    const progressData = userProgressSnap.data();
    expect(progressData.score).toBe(expectedScore);
    expect(progressData.totalQuestions).toBe(mockQuizQuestions[quizId].length);
    expect(progressData.langId).toBe(langId);
    expect(progressData.quizTitle).toBe(mockQuizzes[langId][0].title);
    // Check answers (assuming userAnswers stores selected option text)
    expect(progressData.answers[mockQuizQuestions[quizId][0].id]).toBe(firstCorrectAnswer);
    expect(progressData.answers[mockQuizQuestions[quizId][1].id]).toBe(secondCorrectAnswer);
  });

  test('FlashcardTrainerComponent: should fetch flashcards, allow interaction, and store progress', async () => {
    const db = getFirestore(mockLearnerUser);
    await seedData(db); // Ensures lessons and flashcards are seeded

    const langId = 'testLang1';
    const lessonId = 'lesson1'; // Flashcards are under this lesson

    render(
      <MockAuthProvider currentUser={mockLearnerUser}>
        <MemoryRouter initialEntries={[`/flashcards/${langId}/${lessonId}`]}>
          <Routes>
            <Route path="/flashcards/:langId/:lessonId" element={<FlashcardTrainerComponent />} />
            {/* Dummy route for navigation after session, if needed */}
            <Route path="/lessons/:langId/:lessonId" element={<div>Mock Lesson Detail Page</div>} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );

    // 1. Wait for flashcards to load and first card to be displayed
    const firstCardFront = mockFlashcards[langId][lessonId][0].front;
    await waitFor(() => {
      expect(screen.getByText('Flashcard Practice')).toBeInTheDocument();
      expect(screen.getByText(firstCardFront)).toBeInTheDocument(); // Front of the first card
    });

    // 2. Interact with the first flashcard - mark as 'Knew It'
    const knewItButton = screen.getByRole('button', { name: 'Knew It!' });
    fireEvent.click(knewItButton);

    // 3. Wait for the second flashcard to be displayed
    const secondCardFront = mockFlashcards[langId][lessonId][1].front;
    await waitFor(() => {
      expect(screen.getByText(secondCardFront)).toBeInTheDocument();
    });

    // 4. Interact with the second flashcard - mark as 'Didn't Know'
    const didntKnowButton = screen.getByRole('button', { name: "Didn't Know" });
    fireEvent.click(didntKnowButton);

    // 5. Verify session results are displayed
    await waitFor(() => {
      expect(screen.getByText('Session Complete!')).toBeInTheDocument();
      expect(screen.getByText('Total Cards: 2')).toBeInTheDocument();
      expect(screen.getByText('Known: 1')).toBeInTheDocument();
      expect(screen.getByText('Unknown: 1')).toBeInTheDocument();
    });

    // 6. Verify progress stored in Firestore
    const progressId = `${lessonId}_flashcards`;
    const userProgressRef = doc(db, 'users', mockLearnerUser.uid, 'userProgress', progressId);
    const userProgressSnap = await assertSucceeds(getDoc(userProgressRef));
    expect(userProgressSnap.exists()).toBe(true);
    const progressData = userProgressSnap.data();

    expect(progressData.type).toBe('flashcards');
    expect(progressData.langId).toBe(langId);
    expect(progressData.lessonId).toBe(lessonId);
    expect(progressData.score).toBe(1); // Known cards
    expect(progressData.total).toBe(mockFlashcards[langId][lessonId].length);
    expect(progressData.knownCards).toEqual([mockFlashcards[langId][lessonId][0].id]);
    expect(progressData.unknownCards).toEqual([mockFlashcards[langId][lessonId][1].id]);
  });

  test('UserProfilePage: should fetch and display user learning statistics', async () => {
    const db = getFirestore(mockLearnerUser);
    // Seed initial user data and some progress data
    await seedData(db); // This already seeds basic user info

    const langId = 'testLang1';
    const quizIdForProfile = 'quiz1'; // Must match a quizId from mockQuizzes
    const lessonIdForFlashcards = 'lesson1'; // Must match a lessonId from mockFlashcards
    const flashcardProgressId = `${lessonIdForFlashcards}_flashcards`;

    // Seed some quiz progress for the user
    await setDoc(doc(db, 'users', mockLearnerUser.uid, 'userProgress', quizIdForProfile), {
      quizTitle: mockQuizzes[langId].find(q => q.id === quizIdForProfile).title,
      langId: langId,
      score: 15,
      totalPossibleScore: 20,
      percentage: 75,
      completedAt: serverTimestamp(),
      type: 'quiz' // Assuming a type field to differentiate progress items
    });

    // Seed some flashcard session progress for the user
    await setDoc(doc(db, 'users', mockLearnerUser.uid, 'userProgress', flashcardProgressId), {
      lessonId: lessonIdForFlashcards,
      langId: langId,
      type: 'flashcards',
      score: 1, // e.g., 1 known card
      total: 2, // e.g., 2 total cards in set
      completedAt: serverTimestamp(),
    });
    
    // Seed a completed lesson (mocking a simple lesson completion marker)
    await setDoc(doc(db, 'users', mockLearnerUser.uid, 'userProgress', 'lesson1_completed'), {
        type: 'lesson',
        lessonId: 'lesson1',
        langId: langId,
        title: 'Lesson 1: Basics', // Match lesson title from mockLessons
        completedAt: serverTimestamp(),
        status: 'completed'
    });

    render(
      <MockAuthProvider currentUser={mockLearnerUser}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserProfilePage />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );

    // Verify user's name is displayed
    await waitFor(() => {
      expect(screen.getByText(mockLearnerUser.displayName)).toBeInTheDocument();
    });

    // Verify learning statistics are displayed
    // These assertions depend heavily on how UserProfilePage structures its output.
    // Adjust selectors as needed based on UserProfilePage.js implementation.

    // Example: Check for completed lessons count (assuming UserProfilePage counts items with type 'lesson' and status 'completed')
    expect(await screen.findByText(/Completed Lessons: 1/i)).toBeInTheDocument();

    // Example: Check for quiz scores (assuming UserProfilePage lists quiz titles and scores)
    // The text might be something like "General Knowledge Quiz: 15 / 20 (75%)"
    const quizProgressTitle = mockQuizzes[langId].find(q => q.id === quizIdForProfile).title;
    expect(await screen.findByText(new RegExp(`${quizProgressTitle}.*15 / 20`, 'i'))).toBeInTheDocument();

    // Example: Check for flashcard session (assuming UserProfilePage might show 'Flashcards for Lesson 1: 1/2 known')
    // This depends on how UserProfilePage formats flashcard progress.
    // For simplicity, let's assume it might list the type and score/total.
    const flashcardLessonTitle = mockLessons[langId].find(l => l.id === lessonIdForFlashcards).title;
    expect(await screen.findByText(new RegExp(`Flashcards for ${flashcardLessonTitle}.*1 / 2`, 'i'))).toBeInTheDocument();
    // A more specific check might be needed if titles are involved:
    // expect(await screen.findByText(new RegExp(`Flashcards for Lesson 1.*1 known / 2 total`, 'i'))).toBeInTheDocument();

    // Check for last activity date (this is tricky to test precisely without knowing the exact format 
    // and mocking serverTimestamp perfectly, but we can check for its presence)
    expect(await screen.findByText(/Last Activity:/i)).toBeInTheDocument();
  });
});