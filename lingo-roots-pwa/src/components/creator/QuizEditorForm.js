import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { db } from '../../services/firebase'; // Assuming firebase storage is exported from here
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import './QuizEditorForm.css'; // We will create this CSS file next

// Validation Schema
const questionSchema = Yup.object().shape({
  id: Yup.string(), // for existing questions during edit
  text: Yup.string().required('Question text is required').min(5, 'Question text must be at least 5 characters'),
  type: Yup.string().required('Question type is required').oneOf(['multiple-choice', 'true-false'], 'Invalid question type'),
  options: Yup.array().when('type', {
    is: 'multiple-choice',
    then: () => Yup.array().of(
      Yup.object().shape({
        text: Yup.string().required('Option text is required'),
        isCorrect: Yup.boolean(),
      })
    ).min(2, 'Multiple-choice questions must have at least 2 options')
     .test('at-least-one-correct', 'At least one option must be correct', (options) => {
        return options ? options.some(opt => opt.isCorrect) : false;
     }),
    otherwise: () => Yup.array().nullable(),
  }),
  correctAnswer: Yup.boolean().when('type', {
    is: 'true-false',
    then: () => Yup.boolean().required('Correct answer must be specified for True/False questions'),
    otherwise: () => Yup.boolean().nullable(),
  }),
});

const validationSchema = Yup.object().shape({
  title: Yup.string().required('Quiz title is required').min(3, 'Title must be at least 3 characters'),
  languageId: Yup.string().required('Language ID is required'),
  questions: Yup.array().of(questionSchema).min(1, 'A quiz must have at least one question'),
});

const QuizEditorForm = ({ quizId, langId, onFormSubmitSuccess }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!quizId);

  const { control, register, handleSubmit, setValue, getValues, watch, formState: { errors }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: '',
      languageId: langId || '',
      questions: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    if (langId) {
      setValue('languageId', langId);
    }
  }, [langId, setValue]);

  useEffect(() => {
    if (isEditMode && quizId && langId && currentUser) {
      const fetchQuizData = async () => {
        setLoading(true);
        try {
          const quizRef = doc(db, 'languages', langId, 'quizzes', quizId);
          const quizSnap = await getDoc(quizRef);
          if (quizSnap.exists()) {
            const quizData = quizSnap.data();
            setValue('title', quizData.title);
            setValue('languageId', langId);
            // Fetch questions from subcollection
            const questionsColRef = collection(db, 'languages', langId, 'quizzes', quizId, 'questions');
            const questionsSnap = await getDocs(questionsColRef);
            const fetchedQuestions = questionsSnap.docs.map(qDoc => ({ id: qDoc.id, ...qDoc.data() }));
            setValue('questions', fetchedQuestions);
          } else {
            toast.error('Quiz not found.');
            // navigate('/creator-dashboard'); // Or some error page
          }
        } catch (error) {
          console.error('Error fetching quiz:', error);
          toast.error('Failed to load quiz data.');
        }
        setLoading(false);
      };
      fetchQuizData();
    }
  }, [isEditMode, quizId, langId, setValue, currentUser, navigate]);

  const onSubmit = async (data) => {
    if (!currentUser) {
      toast.error('You must be logged in to perform this action.');
      return;
    }
    setLoading(true);

    try {
      const quizData = {
        title: data.title,
        langId: data.languageId,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      };

      let currentQuizId = quizId;

      if (isEditMode) {
        const quizRef = doc(db, 'languages', data.languageId, 'quizzes', currentQuizId);
        await updateDoc(quizRef, quizData);
        toast.success('Quiz updated successfully!');
      } else {
        quizData.createdAt = serverTimestamp();
        quizData.createdBy = currentUser.uid;
        const quizzesCollectionRef = collection(db, 'languages', data.languageId, 'quizzes');
        const newQuizRef = await addDoc(quizzesCollectionRef, quizData);
        currentQuizId = newQuizRef.id;
        toast.success('Quiz created successfully!');
      }

      // Save/Update questions in subcollection
      for (const question of data.questions) {
        const questionRef = question.id 
            ? doc(db, 'languages', data.languageId, 'quizzes', currentQuizId, 'questions', question.id)
            : doc(collection(db, 'languages', data.languageId, 'quizzes', currentQuizId, 'questions'));
        
        const questionData = { ...question };
        delete questionData.id; // Don't store react-hook-form's internal id if it's a new question
        if (!question.id) questionData.createdAt = serverTimestamp(); // Add createdAt for new questions
        questionData.updatedAt = serverTimestamp();

        await setDoc(questionRef, questionData, { merge: true });
      }
      
      // TODO: Handle deletion of questions not present in `data.questions` but existing in subcollection if it's an edit.

      if (onFormSubmitSuccess) onFormSubmitSuccess(currentQuizId);
      if (!isEditMode) {
        reset();
        // navigate(`/creator-dashboard/quizzes/${data.languageId}/${currentQuizId}/edit`); // Option to navigate to edit mode
      } else {
        // Potentially re-fetch to ensure data consistency if staying on page
      }

    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error(`Failed to save quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type = 'multiple-choice') => {
    const defaultQuestion = {
      text: '',
      type: type,
      options: type === 'multiple-choice' ? [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] : [],
      correctAnswer: type === 'true-false' ? true : null,
    };
    append(defaultQuestion);
  };

  const addOption = (questionIndex) => {
    const questions = getValues('questions');
    const currentOptions = questions[questionIndex].options || [];
    setValue(`questions.${questionIndex}.options`, [...currentOptions, { text: '', isCorrect: false }]);
  };

 const removeOption = (questionIndex, optionIndex) => {
    const questions = getValues('questions');
    const currentOptions = questions[questionIndex].options || [];
    currentOptions.splice(optionIndex, 1);
    setValue(`questions.${questionIndex}.options`, currentOptions);
  };

  if (loading && isEditMode) { 
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading quiz details...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="quiz-editor-form bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-marine-blue dark:text-sky-300 mb-6 text-center">
        {isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
      </h2>

      <div>
        <label htmlFor="languageId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language ID</label>
        <input 
          type="text" 
          id="languageId" 
          {...register('languageId')} 
          className={`mt-1 block w-full px-3 py-2 border ${errors.languageId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
          placeholder="e.g., duala, bassa" 
          readOnly={!!langId} 
        />
        {errors.languageId && <p className="mt-1 text-xs text-red-500">{errors.languageId.message}</p>}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Title</label>
        <input 
          type="text" 
          id="title" 
          {...register('title')} 
          className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
          placeholder="Enter quiz title"
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <hr className="dark:border-gray-600"/>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Questions</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="question-block border border-gray-300 dark:border-gray-700 p-4 rounded-md mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Question {index + 1}</h4>
              <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">
                Remove Question
              </button>
            </div>

            <div>
              <label htmlFor={`questions.${index}.text`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Text</label>
              <textarea 
                id={`questions.${index}.text`} 
                {...register(`questions.${index}.text`)} 
                rows="3"
                className={`mt-1 block w-full px-3 py-2 border ${errors.questions?.[index]?.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                placeholder="Enter question text"
              />
              {errors.questions?.[index]?.text && <p className="mt-1 text-xs text-red-500">{errors.questions[index].text.message}</p>}
            </div>

            <div>
              <label htmlFor={`questions.${index}.type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Type</label>
              <select 
                id={`questions.${index}.type`} 
                {...register(`questions.${index}.type`)} 
                className={`mt-1 block w-full px-3 py-2 border ${errors.questions?.[index]?.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                onChange={(e) => {
                  setValue(`questions.${index}.type`, e.target.value);
                  if (e.target.value === 'multiple-choice') {
                    setValue(`questions.${index}.options`, [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
                    setValue(`questions.${index}.correctAnswer`, null);
                  } else if (e.target.value === 'true-false') {
                    setValue(`questions.${index}.options`, []);
                    setValue(`questions.${index}.correctAnswer`, true);
                  }
                }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
              </select>
              {errors.questions?.[index]?.type && <p className="mt-1 text-xs text-red-500">{errors.questions[index].type.message}</p>}
            </div>

            {watch(`questions.${index}.type`) === 'multiple-choice' && (
              <div className="options-block space-y-3 pl-4 border-l-2 border-sky-500 dark:border-sky-400">
                <h5 className="text-md font-medium text-gray-700 dark:text-gray-300">Options</h5>
                {watch(`questions.${index}.options`)?.map((option, optIndex) => (
                  <div key={optIndex} className="option-item flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <input 
                      type="text" 
                      {...register(`questions.${index}.options.${optIndex}.text`)} 
                      className={`flex-grow px-2 py-1 border ${errors.questions?.[index]?.options?.[optIndex]?.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm sm:text-sm dark:bg-gray-600 dark:text-white`}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`questions.${index}.options.${optIndex}.isCorrect`}
                        {...register(`questions.${index}.options.${optIndex}.isCorrect`)} 
                        className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor={`questions.${index}.options.${optIndex}.isCorrect`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">Correct</label>
                    </div>
                    <button type="button" onClick={() => removeOption(index, optIndex)} className="text-red-500 hover:text-red-600 text-sm">
                      Remove
                    </button>
                  </div>
                ))}
                {errors.questions?.[index]?.options?.message && <p className="mt-1 text-xs text-red-500">{errors.questions[index].options.message}</p>}
                <button type="button" onClick={() => addOption(index)} className="mt-2 px-3 py-1.5 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600">
                  Add Option
                </button>
              </div>
            )}

            {watch(`questions.${index}.type`) === 'true-false' && (
              <div className="true-false-block pl-4 border-l-2 border-green-500 dark:border-green-400">
                <h5 className="text-md font-medium text-gray-700 dark:text-gray-300">Correct Answer</h5>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      {...register(`questions.${index}.correctAnswer`)} 
                      value="true" 
                      checked={watch(`questions.${index}.correctAnswer`) === true || String(watch(`questions.${index}.correctAnswer`)) === 'true'}
                      onChange={() => setValue(`questions.${index}.correctAnswer`, true)}
                      className="form-radio h-4 w-4 text-sky-600 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">True</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      {...register(`questions.${index}.correctAnswer`)} 
                      value="false" 
                      checked={watch(`questions.${index}.correctAnswer`) === false || String(watch(`questions.${index}.correctAnswer`)) === 'false'}
                      onChange={() => setValue(`questions.${index}.correctAnswer`, false)}
                      className="form-radio h-4 w-4 text-sky-600 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">False</span>
                  </label>
                </div>
                {errors.questions?.[index]?.correctAnswer && <p className="mt-1 text-xs text-red-500">{errors.questions[index].correctAnswer.message}</p>}
              </div>
            )}
          </div>
        ))}
        {errors.questions?.message && <p className="mt-1 text-xs text-red-500">{errors.questions.message}</p>}

        <div className="flex gap-4 mt-6">
          <button 
            type="button" 
            onClick={() => addQuestion('multiple-choice')} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Multiple Choice Question
          </button>
          <button 
            type="button" 
            onClick={() => addQuestion('true-false')} 
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Add True/False Question
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-600 flex justify-end">
        <button 
          type="submit" 
          disabled={loading} 
          className="px-6 py-3 bg-marine-blue text-white font-semibold rounded-lg shadow-md hover:bg-marine-blue-dark transition-colors disabled:opacity-50"
        >
          {loading ? (isEditMode ? 'Updating Quiz...' : 'Creating Quiz...') : (isEditMode ? 'Update Quiz' : 'Create Quiz')}
        </button>
      </div>
    </form>
  );
};

export default QuizEditorForm;