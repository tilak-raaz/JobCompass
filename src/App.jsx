import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.config";

// Pages
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/Dashboard";
import JobDashboard from "./pages/JobDashboard";
import JobSearchComponent from "./pages/JobSearchComponents.jsx";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import NotFoundPage from "./pages/NotFoundPage";
import ApplicationsPage from "./pages/ApplicationsPage";

// Components
import LoadingScreen from "./components/LoadingScreen";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/signin" 
          element={user ? <Navigate to="/dashboard" /> : <SignInPage />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <SignUpPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <DashboardPage /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/jobs" 
          element={user ? <JobDashboard /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/job-search" 
          element={user ? <JobSearchComponent /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/profile-setup" 
          element={user ? <ProfileSetupPage /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/applications" 
          element={user ? <ApplicationsPage /> : <Navigate to="/signin" />} 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;