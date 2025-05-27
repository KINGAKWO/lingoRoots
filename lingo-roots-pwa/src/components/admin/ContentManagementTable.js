import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase'; // Corrected path
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './ContentManagementTable.css'; // We will create this file next

const ContentManagementTable = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [contentTypeToDelete, setContentTypeToDelete] = useState(''); // 'lesson' or 'quiz'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Or make this configurable

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const languagesSnapshot = await getDocs(collection(db, 'languages'));
        const allContent = [];

        for (const langDoc of languagesSnapshot.docs) {
          const langId = langDoc.id;
          const langData = langDoc.data();

          // Fetch lessons for this language
          const lessonsSnapshot = await getDocs(collection(db, 'languages', langId, 'lessons'));
          const lessonsData = lessonsSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            type: 'Lesson', 
            languageId: langId, // Ensure languageId is stored
            languageName: langData.name || langId // Store language name for display if available
          }));
          allContent.push(...lessonsData);

          // Fetch quizzes for this language
          const quizzesSnapshot = await getDocs(collection(db, 'languages', langId, 'quizzes'));
          const quizzesData = quizzesSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            type: 'Quiz', 
            languageId: langId, // Ensure languageId is stored
            languageName: langData.name || langId // Store language name for display if available
          }));
          allContent.push(...quizzesData);
        }

        setContent(allContent.sort((a, b) => a.title.localeCompare(b.title)));
      } catch (err) {
        console.error("Error fetching content:", err);
        setError('Failed to load content. Please try again later.');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete || !contentTypeToDelete) return;

    const collectionName = contentTypeToDelete === 'Lesson' ? 'lessons' : 'quizzes';
    // Ensure itemToDelete has languageId, which it should if fetched correctly
    if (!itemToDelete.languageId) {
        setError(`Cannot delete ${contentTypeToDelete}: Language ID is missing.`);
        setShowConfirmDialog(false);
        return;
    }

    try {
      await deleteDoc(doc(db, 'languages', itemToDelete.languageId, collectionName, itemToDelete.id));
      setContent(prevContent => prevContent.filter(item => !(item.id === itemToDelete.id && item.languageId === itemToDelete.languageId)));
      console.log(`${contentTypeToDelete} '${itemToDelete.title}' (ID: ${itemToDelete.id}) from language ${itemToDelete.languageId} deleted successfully.`);
    } catch (err) {
      console.error(`Error deleting ${contentTypeToDelete}:`, err);
      setError(`Failed to delete ${contentTypeToDelete}. Please try again.`);
    }
    setShowConfirmDialog(false);
    setItemToDelete(null);
    setContentTypeToDelete('');
  };

  const openConfirmDialog = (item, type) => {
    setItemToDelete(item);
    setContentTypeToDelete(type);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setItemToDelete(null);
    setContentTypeToDelete('');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = content.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(content.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-700">Loading content...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Content Management</h1>
      
      {content.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No content available yet. Start by creating some lessons or quizzes!</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Language
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'Lesson' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.languageName || item.languageId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link 
                        to={`/${item.type.toLowerCase()}s/${item.languageId}/${item.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 ease-in-out"
                        title={`View ${item.title} in ${item.languageName || item.languageId}`}
                      >
                        View
                      </Link>
                      <Link 
                        to={`/creator-dashboard/${item.type.toLowerCase() === 'lesson' ? 'lessons' : 'quizzes'}/${item.languageId}/${item.id}/edit`} 
                        className="text-yellow-600 hover:text-yellow-900 transition-colors duration-150 ease-in-out"
                        title={`Edit ${item.title} in ${item.languageName || item.languageId}`}
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => openConfirmDialog(item, item.type)} 
                        className="text-red-600 hover:text-red-900 transition-colors duration-150 ease-in-out font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */} 
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
              <div className="-mt-px flex w-0 flex-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
              </div>
              <div className="hidden md:-mt-px md:flex">
                {[...Array(totalPages).keys()].map(number => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${currentPage === number + 1 ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {number + 1}
                  </button>
                ))}
              </div>
              <div className="-mt-px flex w-0 flex-1 justify-end">
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* Confirmation Dialog */} 
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Confirm Deletion</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={closeConfirmDialog}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementTable;