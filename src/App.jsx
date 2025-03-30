import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.config";
// Pages
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import DashboardPage from "./pages/Dashboard";
import JobDashboard from "./pages/JobDashboard";
import JobSearchComponent from "./pages/JobSearchComponents";
import NotFoundPage from "./pages/NotFoundPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ResumeUpload from "./pages/ResumeUpload";
import EditProfile from "./pages/EditProfile";
// Components
import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/Navbar";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth listener in App component");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
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
          element={user ? <Navigate to="/dashboard" /> : <SignInPage />}
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
          path="/profile-setup"
          element={user ? <ProfileSetupPage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <>
                <Navbar />
                <DashboardPage />
              </>
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/edit-profile"
          element={
            user ? (
              <EditProfile />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/jobs"
          element={
            user ? (
              <>
                <Navbar />
                <JobDashboard />
              </>
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/search"
          element={user ? <JobSearchComponent /> : <Navigate to="/signin" />}
        />
        <Route
          path="/job-search"
          element={user ? <JobSearchComponent /> : <Navigate to="/signin" />}
        />
        <Route
          path="/applications"
          element={
            user ? (
              <>
                <Navbar />
                <ApplicationsPage />
              </>
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/resume"
          element={
            user ? (
              <>
                <Navbar />
                <ResumeUpload />
              </>
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;