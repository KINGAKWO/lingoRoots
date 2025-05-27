import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import MainLayout from '../../layouts/MainLayout';
import QuestionComponent from '../../components/quiz/QuestionComponent';
import './QuizViewComponent.css'; // We'll create this CSS file next

const QuizViewComponent = () => {
  const { langId, quizId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quizMetadata, setQuizMetadata] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Store as { questionId: answer }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      toast.error('You must be logged in to take a quiz.');
      navigate('/signin');
      return;
    }

    const fetchQuizData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch quiz metadata
        const quizRef = doc(db, 'languages', langId, 'quizzes', quizId);
        const quizSnap = await getDoc(quizRef);

        if (!quizSnap.exists()) {
          throw new Error('Quiz not found.');
        }
        setQuizMetadata({ id: quizSnap.id, ...quizSnap.data() });

        // Fetch quiz questions
        const questionsQuery = query(
          collection(db, 'languages', langId, 'quizzes', quizId, 'questions'),
          orderBy('order', 'asc') // Assuming an 'order' field for questions
        );
        const questionsSnap = await getDocs(questionsQuery);
        const fetchedQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (fetchedQuestions.length === 0) {
          throw new Error('No questions found for this quiz.');
        }
        setQuestions(fetchedQuestions);

      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(`Failed to load quiz: ${err.message}`);
        toast.error(`Failed to load quiz: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [langId, quizId, currentUser, navigate]);

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Last question, submit the quiz
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentUser || questions.length === 0) return;

    let calculatedScore = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        calculatedScore += (q.points || 1); // Default to 1 point if not specified
      }
    });
    setScore(calculatedScore);
    setQuizCompleted(true);

    try {
      const progressRef = doc(db, 'users', currentUser.uid, 'userProgress', quizId);
      await setDoc(progressRef, {
        quizTitle: quizMetadata?.title || 'Quiz',
        langId: langId,
        score: calculatedScore,
        totalQuestions: questions.length,
        totalPossibleScore: questions.reduce((sum, q) => sum + (q.points || 1), 0),
        percentage: parseFloat(((calculatedScore / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100).toFixed(2)),
        completedAt: serverTimestamp(),
        answers: userAnswers, // Optionally store all answers
      }, { merge: true });
      toast.success('Quiz submitted! Your score has been saved.');
    } catch (err) {
      console.error('Error saving quiz progress:', err);
      toast.error(`Failed to save your score: ${err.message}`);
      setError(`Failed to save score: ${err.message}`);
    }
  };

  if (loading) {
    return <MainLayout><div className="p-6 text-center text-gray-500">Loading quiz...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="p-6 text-center text-red-500">Error: {error}</div></MainLayout>;
  }

  if (quizCompleted) {
    const totalPossibleScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    return (
      <MainLayout>
        <div className="quiz-view-container container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-marine-blue mb-4">Quiz Completed!</h1>
          <h2 className="text-2xl text-sky-700 mb-2">{quizMetadata?.title}</h2>
          <p className="text-xl mb-6">
            Your Score: <span className="font-bold">{score}</span> / {totalPossibleScore}
          </p>
          <button 
            onClick={() => navigate(`/lessons/${langId}`)} // Or to a dashboard or quiz list
            className="px-6 py-3 bg-marine-blue text-white rounded-md hover:bg-marine-blue-dark transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </MainLayout>
    );
  }

  if (questions.length === 0) {
    return <MainLayout><div className="p-6 text-center text-gray-500">No questions available for this quiz.</div></MainLayout>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <MainLayout>
      <div className="quiz-view-container container mx-auto px-4 py-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-marine-blue mb-2">{quizMetadata?.title || 'Quiz'}</h1>
          <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </header>

        <QuestionComponent 
          question={currentQuestion}
          onAnswer={handleAnswerSelect}
          selectedAnswer={userAnswers[currentQuestion.id] || null}
        />

        <div className="navigation-controls mt-8 flex justify-center">
          <button 
            onClick={handleNextQuestion}
            disabled={!userAnswers[currentQuestion.id]} // Disable if no answer selected for current question
            className="px-8 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuizViewComponent;