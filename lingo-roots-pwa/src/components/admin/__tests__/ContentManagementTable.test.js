import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import ContentManagementTable from '../ContentManagementTable';
import { db } from '../../../services/firebase'; // Adjusted path
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mock db export from firebase.js
jest.mock('../../../services/firebase', () => ({
  db: jest.fn(), // Mock the db export itself
}));

const mockLessons = [
  { id: 'lesson1', title: 'Introduction to Spanish', type: 'Lesson', languageId: 'spanish', languageName: 'Spanish' },
  { id: 'lesson2', title: 'Basic French Grammar', type: 'Lesson', languageId: 'french', languageName: 'French' },
];

const mockQuizzes = [
  { id: 'quiz1', title: 'Spanish Vocabulary Quiz', type: 'Quiz', languageId: 'spanish', languageName: 'Spanish' },
];

const mockLanguages = [
  { id: 'spanish', data: () => ({ name: 'Spanish' }) },
  { id: 'french', data: () => ({ name: 'French' }) },
];

describe('ContentManagementTable', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock getDocs for languages
    getDocs.mockImplementation((path) => {
      if (path.path === 'languages') {
        return Promise.resolve({ docs: mockLanguages });
      }
      // Mock getDocs for lessons within a language
      if (path.path.includes('lessons')) {
        const langId = path.path.split('/')[1];
        const lessonsForLang = mockLessons.filter(l => l.languageId === langId);
        return Promise.resolve({ docs: lessonsForLang.map(l => ({ id: l.id, data: () => l })) });
      }
      // Mock getDocs for quizzes within a language
      if (path.path.includes('quizzes')) {
        const langId = path.path.split('/')[1];
        const quizzesForLang = mockQuizzes.filter(q => q.languageId === langId);
        return Promise.resolve({ docs: quizzesForLang.map(q => ({ id: q.id, data: () => q })) });
      }
      return Promise.resolve({ docs: [] });
    });

    deleteDoc.mockResolvedValue();
  });

  test('renders loading state initially', () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    expect(screen.getByText(/Loading content.../i)).toBeInTheDocument();
  });

  test('renders content after fetching', async () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );

    // Wait for loading to disappear and content to appear
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    expect(screen.getByText('Introduction to Spanish')).toBeInTheDocument();
    expect(screen.getByText('Basic French Grammar')).toBeInTheDocument();
    expect(screen.getByText('Spanish Vocabulary Quiz')).toBeInTheDocument();
    expect(screen.getAllByText('Lesson').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  test('displays "No content available" message when there is no content', async () => {
    // Override mock for this specific test to return no languages
    getDocs.mockImplementation((path) => {
        if (path.path === 'languages') {
            return Promise.resolve({ docs: [] }); // No languages means no content
        }
        return Promise.resolve({ docs: [] });
    });

    render(
        <Router>
            <ContentManagementTable />
        </Router>
    );

    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());
    expect(screen.getByText(/No content available yet/i)).toBeInTheDocument();
  });

  test('renders error message on fetch failure', async () => {
    getDocs.mockRejectedValue(new Error('Failed to fetch'));
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );

    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());
    expect(screen.getByText(/Error: Failed to load content/i)).toBeInTheDocument();
  });

  test('opens confirm dialog on delete button click', async () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Click delete for the first item

    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument(); // Assuming dialog has this text
    expect(screen.getByText(/Introduction to Spanish/i)).toBeInTheDocument(); // Check if item title is in dialog
  });

  test('closes confirm dialog on cancel', async () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel')); // Assuming 'Cancel' button in dialog

    await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument();
    });
  });

  test('calls deleteDoc and updates UI on confirm delete', async () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    // Ensure the item to be deleted is present
    expect(screen.getByText('Introduction to Spanish')).toBeInTheDocument();

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Click delete for 'Introduction to Spanish'

    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Confirm Delete')); // Assuming 'Confirm Delete' button

    await waitFor(() => expect(deleteDoc).toHaveBeenCalledTimes(1));
    expect(deleteDoc).toHaveBeenCalledWith(doc(db, 'languages', 'spanish', 'lessons', 'lesson1'));

    // Check if the item is removed from the UI
    await waitFor(() => {
        expect(screen.queryByText('Introduction to Spanish')).not.toBeInTheDocument();
    });
  });

   test('handles delete error gracefully', async () => {
    deleteDoc.mockRejectedValueOnce(new Error('Failed to delete'));
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Confirm Delete'));

    await waitFor(() => {
        expect(screen.getByText(/Failed to delete Lesson. Please try again./i)).toBeInTheDocument();
    });
    // Ensure the item is still there because delete failed
    expect(screen.getByText('Introduction to Spanish')).toBeInTheDocument(); 
  });

  test('pagination works correctly', async () => {
    // Create more items than itemsPerPage to test pagination
    const manyLessons = Array.from({ length: 15 }, (_, i) => (
        { id: `lesson${i}`, title: `Lesson ${i}`, type: 'Lesson', languageId: 'multiLang', languageName: 'Multi Language' }
    ));
    const manyLanguages = [{ id: 'multiLang', data: () => ({ name: 'Multi Language' }) }];

    getDocs.mockImplementation((path) => {
        if (path.path === 'languages') {
            return Promise.resolve({ docs: manyLanguages });
        }
        if (path.path.includes('lessons')) {
            return Promise.resolve({ docs: manyLessons.map(l => ({ id: l.id, data: () => l })) });
        }
        if (path.path.includes('quizzes')) {
            return Promise.resolve({ docs: [] }); // No quizzes for this test
        }
        return Promise.resolve({ docs: [] });
    });

    render(
        <Router>
            <ContentManagementTable />
        </Router>
    );

    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    // Assuming itemsPerPage is 10 (as in component)
    expect(screen.getByText('Lesson 0')).toBeInTheDocument();
    expect(screen.getByText('Lesson 9')).toBeInTheDocument();
    expect(screen.queryByText('Lesson 10')).not.toBeInTheDocument();

    // Navigate to next page
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
        expect(screen.queryByText('Lesson 0')).not.toBeInTheDocument();
        expect(screen.getByText('Lesson 10')).toBeInTheDocument();
        expect(screen.getByText('Lesson 14')).toBeInTheDocument();
    });

    // Navigate to previous page
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => {
        expect(screen.getByText('Lesson 0')).toBeInTheDocument();
        expect(screen.queryByText('Lesson 10')).not.toBeInTheDocument();
    });
  });

  test('View and Edit links have correct paths', async () => {
    render(
      <Router>
        <ContentManagementTable />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading content.../i)).not.toBeInTheDocument());

    const viewLinks = screen.getAllByText('View');
    const editLinks = screen.getAllByText('Edit');

    // Check links for the first lesson (Introduction to Spanish)
    expect(viewLinks[0]).toHaveAttribute('href', '/lessons/spanish/lesson1');
    expect(editLinks[0]).toHaveAttribute('href', '/creator-dashboard/lessons/spanish/lesson1/edit');

    // Check links for the quiz (Spanish Vocabulary Quiz) - it will be the 3rd item after sorting
    // Need to find it more robustly if sorting changes or more items are added
    const quizRow = screen.getByText('Spanish Vocabulary Quiz').closest('tr');
    const quizViewLink = quizRow.querySelector('a[href^="/quizzes"]');
    const quizEditLink = quizRow.querySelector('a[href^="/creator-dashboard/quizzes"]');

    expect(quizViewLink).toHaveAttribute('href', '/quizzes/spanish/quiz1');
    expect(quizEditLink).toHaveAttribute('href', '/creator-dashboard/quizzes/spanish/quiz1/edit');
  });

});