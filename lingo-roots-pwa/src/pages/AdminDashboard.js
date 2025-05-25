import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase'; // Assuming firebase config is in services/firebase.js
import { useAuth } from '../context/AuthContext'; // Corrected to useAuth hook

const AdminDashboard = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser: user } = useAuth(); // Renamed currentUser to user for consistency with existing code

  // TODO: Replace 'modules_collection_name' with the actual Firestore collection name for modules
  const MODULES_COLLECTION = 'languages'; // Placeholder, adjust as per your Firestore structure

  useEffect(() => {
    const fetchModules = async () => {
      if (user?.role !== 'Administrator') {
        setError('Access Denied: You do not have permission to view this page.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Assuming modules are stored in a top-level collection or a subcollection
        // This example fetches from a top-level collection named MODULES_COLLECTION
        // Adjust query if modules are nested, e.g., under each language
        const querySnapshot = await getDocs(collection(db, MODULES_COLLECTION));
        const modulesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // If modules are under each language, you might need a more complex fetch logic:
        // e.g., fetch all languages, then for each language, fetch its modules.
        // For simplicity, this example assumes a flat 'modules' collection or similar.
        
        setModules(modulesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user]);

  const handleApprove = async (moduleId) => {
    try {
      const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
      await updateDoc(moduleRef, {
        status: 'approved', // Assuming a 'status' field for modules
        updatedAt: new Date(),
      });
      setModules(prevModules => 
        prevModules.map(m => m.id === moduleId ? { ...m, status: 'approved' } : m)
      );
      alert('Module approved successfully!');
    } catch (err) {
      console.error('Error approving module:', err);
      alert('Failed to approve module.');
    }
  };

  const handleReject = async (moduleId) => {
    try {
      const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
      await updateDoc(moduleRef, {
        status: 'rejected',
        updatedAt: new Date(),
      });
      setModules(prevModules => 
        prevModules.map(m => m.id === moduleId ? { ...m, status: 'rejected' } : m)
      );
      alert('Module rejected successfully!');
    } catch (err) {
      console.error('Error rejecting module:', err);
      alert('Failed to reject module.');
    }
  };

  const handleDelete = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, MODULES_COLLECTION, moduleId));
      setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
      alert('Module deleted successfully!');
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Failed to delete module.');
    }
  };

  // TODO: Implement Edit Metadata functionality (e.g., a modal form)
  const handleEdit = (module) => {
    alert(`Edit functionality for module ${module.id} (name: ${module.name || 'N/A'}) not yet implemented.`);
    // Example: Open a modal with a form to edit module.name, module.description, etc.
  };

  if (loading) {
    return <div className="p-4 text-center">Loading modules...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded">Error: {error}</div>;
  }

  if (user?.role !== 'Administrator') {
    return <div className="p-4 text-red-600">Access Denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4 font-sans">
      <h1 className="text-3xl font-bold text-marine-blue mb-6">Admin Dashboard - Module Moderation</h1>
      
      {modules.length === 0 ? (
        <p className="text-gray-600">No modules found or awaiting moderation.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-sky-blue text-white">
              <tr>
                <th className="py-3 px-4 text-left">Module Name</th>
                <th className="py-3 px-4 text-left">Language</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Created By</th>
                <th className="py-3 px-4 text-left">Created At</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {modules.map((module) => (
                <tr key={module.id} className="border-b hover:bg-sky-blue/10">
                  <td className="py-3 px-4">{module.name || 'N/A'}</td>
                  <td className="py-3 px-4">{module.language || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span 
                      className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${module.status === 'approved' ? 'bg-green-200 text-green-800' : 
                          module.status === 'rejected' ? 'bg-red-200 text-red-800' : 
                          'bg-yellow-200 text-yellow-800'}
                      `}
                    >
                      {module.status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{module.createdBy || 'N/A'}</td>
                  <td className="py-3 px-4">
                    {module.createdAt?.toDate ? module.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center space-x-2">
                    {module.status !== 'approved' && (
                      <button 
                        onClick={() => handleApprove(module.id)} 
                        className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {module.status !== 'rejected' && (
                      <button 
                        onClick={() => handleReject(module.id)} 
                        className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleEdit(module)} 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(module.id)} 
                      className="bg-gray-700 hover:bg-black text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;