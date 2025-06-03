// src/components/LessonEditorForm.js
import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const LessonEditorForm = ({ langId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!langId || !title || !description) return;

    setLoading(true);
    try {
      await addDoc(collection(db, `languages/${langId}/lessons`), {
        title,
        description,
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setDescription('');
      alert('Lesson created successfully!');
    } catch (err) {
      console.error('Error creating lesson:', err);
      alert('Failed to create lesson.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white shadow rounded">
      <h2 className="text-lg font-semibold">📘 Create New Lesson</h2>
      <input
        type="text"
        placeholder="Lesson Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        placeholder="Lesson Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
        rows="4"
        required
      ></textarea>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Saving...' : 'Save Lesson'}
      </button>
    </form>
  );
};

export default LessonEditorForm;
