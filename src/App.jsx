import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import Account from './pages/Account';
import ResumeUpload from './pages/ResumeUpload';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
      </Routes>
    </Router>
  );
};

export default App;