import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast'; // Import Toaster

// Page Components
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import LandingPage from './components/LandingPage/LandingPage';
import AboutPage from './components/AboutPage';
import LanguageDashboard from './components/LanguageDashboards';
import LessonPage from './components/LessonPage';
import LanguageSelector from './components/LanguageSelector';
import ProtectedRoute from './components/ProtectedRoute';

// Role-specific pages
import LearnPage from './pages/LearnPage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
import AdminPage from './pages/AdminPage';
import AdminDashboard from './pages/AdminDashboard';
import ModuleUploader from './pages/ModuleUploader';

function AppRoutes() {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen App-bg">
        <p className="text-center text-xl font-semibold text-gray-700">Loading LingoRoots...</p>
        {/* Placeholder for a spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine-blue-500 ml-4"></div>
      </div>
    );
  }

  let defaultAuthenticatedPath = "/";
  if (currentUser) {
    if (userRole === 'Learner') defaultAuthenticatedPath = '/learn';
    else if (userRole === 'Content Creator') defaultAuthenticatedPath = '/creator-dashboard';
    else if (userRole === 'Administrator') defaultAuthenticatedPath = '/admin';
    else defaultAuthenticatedPath = '/select-language'; 
  }

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to={defaultAuthenticatedPath} replace /> : <LandingPage />} />
      <Route path="/signin" element={currentUser ? <Navigate to={defaultAuthenticatedPath} replace /> : <SignIn />} />
      <Route path="/signup" element={currentUser ? <Navigate to={defaultAuthenticatedPath} replace /> : <SignUp />} />
      <Route path="/about" element={<AboutPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/select-language" element={<LanguageSelector />} />
        <Route path="/lessons" element={<LanguageDashboard />} />
        <Route path="/lessons/:languageId/:lessonId" element={<LessonPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Learner']} />}>
        <Route path="/learn" element={<LearnPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Content Creator', 'Administrator']} />}>
        <Route path="/creator-dashboard" element={<CreatorDashboardPage />} />
        <Route path="/module-uploader" element={<ModuleUploader />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>
      
      {currentUser && <Route path="/*" element={<Navigate to={defaultAuthenticatedPath} replace />} />}
      {!currentUser && <Route path="/*" element={<Navigate to="/" replace />} />}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} /> {/* Add Toaster component here */}
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;