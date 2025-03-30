import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { auth, db, storage } from "../firebase.config";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";

const Dashboard = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Optional profile sections
  const [careerInterests, setCareerInterests] = useState({
    jobTypes: [],
    workTypes: [],
    locations: ""
  });
  const [links, setLinks] = useState({
    linkedin: "",
    portfolio: ""
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  
  const navigate = useNavigate();

  // Job types options
  const jobTypeOptions = ["Tech", "Marketing", "Sales", "Design", "Finance", "HR", "Operations", "Other"];
  const workTypeOptions = ["Full-time", "Part-time", "Contract", "Remote", "Hybrid", "On-site"];

  // Add this near the top of the file, after other constants
  const skillOptions = [
    // Programming Languages
    "JavaScript", "Python", "Java", "C++", "Ruby", "PHP", "Swift", "TypeScript",
    // Web Technologies
    "React", "Angular", "Vue.js", "Node.js", "HTML5", "CSS3", "MongoDB", "SQL",
    // Cloud & DevOps
    "AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Git",
    // Mobile Development
    "React Native", "iOS Development", "Android Development", "Flutter",
    // Other Technical Skills
    "Machine Learning", "Data Analysis", "UI/UX Design", "Agile", "Scrum"
  ];

  useEffect(() => {
    // Check if we should enable editing mode from navigation state
    if (location.state?.isEditing) {
      setIsEditing(true);
      setActiveTab("profile"); // Switch to profile tab for editing
    }
  }, [location.state]);

  useEffect(() => {
    // Set up auth state observer
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
        setLoading(false);
      } else {
        // No user is signed in, redirect to sign-in page
        navigate("/signin");
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Initialize optional fields if they exist
        if (data.careerInterests) {
          setCareerInterests(data.careerInterests);
        }
        if (data.links) {
          setLinks(data.links);
        }
        if (data.resumeUrl) {
          setResumeUrl(data.resumeUrl);
        }
        if (data.resumeAnalysis) {
          setResumeAnalysis(data.resumeAnalysis);
        }
      } else {
        // If user document doesn't exist, they need to complete their profile
        navigate("/profile-setup");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF or DOCX)
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        setNotification({
          show: true,
          message: "Please upload a PDF or DOCX file",
          type: "error"
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleJobTypeToggle = (jobType) => {
    if (careerInterests.jobTypes.includes(jobType)) {
      setCareerInterests({
        ...careerInterests,
        jobTypes: careerInterests.jobTypes.filter(t => t !== jobType)
      });
    } else {
      setCareerInterests({
        ...careerInterests,
        jobTypes: [...careerInterests.jobTypes, jobType]
      });
    }
  };

  const handleWorkTypeToggle = (workType) => {
    if (careerInterests.workTypes.includes(workType)) {
      setCareerInterests({
        ...careerInterests,
        workTypes: careerInterests.workTypes.filter(t => t !== workType)
      });
    } else {
      setCareerInterests({
        ...careerInterests,
        workTypes: [...careerInterests.workTypes, workType]
      });
    }
  };

  const uploadResume = async (uid) => {
    if (!resumeFile) return resumeUrl;
    
    try {
      const fileRef = ref(storage, `resumes/${uid}/${resumeFile.name}`);
      await uploadBytes(fileRef, resumeFile);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading resume:", error);
      throw error;
    }
  };

  // Mock function for AI resume analysis
  const analyzeResume = async () => {
    // In a real app, this would call an AI service
    // For now we'll simulate with mock data
    return {
      suggestions: [
        "Consider adding more quantifiable achievements",
        "Your resume could benefit from more keywords related to your industry",
        "Make your experience section more concise"
      ],
      strengths: [
        "Good education section",
        "Clear job descriptions",
        "Well-structured layout"
      ]
    };
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      let updatedResumeUrl = resumeUrl;
      let analysis = resumeAnalysis;
      
      // Upload resume if a new one was selected
      if (resumeFile) {
        updatedResumeUrl = await uploadResume(user.uid);
        // Analyze the new resume
        analysis = await analyzeResume();
      }
      
      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        fullName: userData.fullName,
        skills: userData.skills || [],
        careerInterests,
        links,
        resumeUrl: updatedResumeUrl,
        resumeAnalysis: analysis,
        updatedAt: new Date()
      });
      
      // Update local state
      setResumeUrl(updatedResumeUrl);
      setResumeFile(null);
      setResumeAnalysis(analysis);
      setIsEditing(false);
      
      // Show success notification
      setNotification({
        show: true,
        message: "Profile updated successfully!",
        type: "success"
      });
      
      // Redirect to dashboard without editing mode
      navigate("/dashboard", { replace: true });
      
      // Refresh user data
      await fetchUserData(user.uid);
    } catch (error) {
      console.error("Error saving profile:", error);
      setNotification({
        show: true,
        message: "Failed to update profile: " + error.message,
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  // Hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-purple-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mt-8 mb-12">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {/* Tabs */}
          <nav className="border-b border-gray-700 mb-6">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'resume'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('resume')}
              >
                Resume
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal-branding'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('personal-branding')}
              >
                Personal Branding
              </button>
            </div>
          </nav>
          
          {/* Tab content */}
          <div className="mt-8">
            {activeTab === 'profile' && (
              <div>
                {/* Profile info section */}
                <section className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {userData?.fullName?.charAt(0) || user?.email?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">{userData?.fullName || "Complete your profile"}</h2>
                      <p className="text-gray-400 mb-4">{user?.email}</p>
                      
                      {/* Skills section */}
                      <div className="mt-4">
                        <h3 className="text-lg font-medium text-white mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {userData?.skills?.map((skill) => (
                            <span 
                              key={skill}
                              className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                          {(!userData?.skills || userData.skills.length === 0) && (
                            <p className="text-gray-500 text-sm">No skills added yet.</p>
                          )}
                        </div>
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={saveProfile}
                          disabled={saving}
                          className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
                
                {/* Add a section for editing skills when in editing mode */}
                {isEditing && (
                  <section className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Edit Skills</h3>
                    
                    {/* Display current skills with delete option */}
                    <div className="mb-4">
                      <p className="text-gray-400 mb-2">Current Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {userData?.skills?.map((skill, index) => (
                          <div 
                            key={index}
                            className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {skill}
                            <button 
                              className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                              onClick={() => {
                                const newSkills = [...userData.skills];
                                newSkills.splice(index, 1);
                                setUserData({...userData, skills: newSkills});
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Add new skills */}
                    <div className="mt-4">
                      <p className="text-gray-400 mb-2">Add Skills:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {skillOptions
                          .filter(skill => !userData?.skills?.includes(skill))
                          .map((skill, index) => (
                            <button
                              key={index}
                              className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                              onClick={() => {
                                const newSkills = [...(userData?.skills || []), skill];
                                setUserData({...userData, skills: newSkills});
                              }}
                            >
                              <span className="mr-1">+</span> {skill}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                    
                    {/* Custom skill input */}
                    <div className="mt-6">
                      <p className="text-gray-400 mb-2">Add Custom Skill:</p>
                      <div className="flex">
                        <input
                          type="text"
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="Enter a custom skill"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const newSkill = e.target.value.trim();
                              if (!userData?.skills?.includes(newSkill)) {
                                const newSkills = [...(userData?.skills || []), newSkill];
                                setUserData({...userData, skills: newSkills});
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-r-lg transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            if (input.value.trim()) {
                              const newSkill = input.value.trim();
                              if (!userData?.skills?.includes(newSkill)) {
                                const newSkills = [...(userData?.skills || []), newSkill];
                                setUserData({...userData, skills: newSkills});
                                input.value = '';
                              }
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
            
            {activeTab === 'resume' && (
              <div>
                {/* Resume content */}
                <section className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                  <h2 className="text-xl font-bold mb-4">Your Resume</h2>
                  
                  {resumeUrl ? (
                    <div>
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg mb-4">
                        <div className="flex items-center">
                          <div className="bg-purple-500 p-2 rounded mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-gray-200">Your uploaded resume</span>
                        </div>
                        <div>
                          <a 
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 mr-4"
                          >
                            View
                          </a>
                        </div>
                      </div>
                      
                      {resumeAnalysis && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-3">Resume Analysis</h3>
                          
                          <div className="mb-4">
                            <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {resumeAnalysis.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-yellow-400 font-medium mb-2">Suggestions for Improvement</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {resumeAnalysis.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">You haven't uploaded a resume yet.</p>
                      <button
                        onClick={() => navigate('/resume')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      >
                        Upload Resume
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
            
            {activeTab === 'personal-branding' && (
              <div>
                {/* Personal branding content */}
                <section className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                  <h2 className="text-xl font-bold mb-4">Personal Branding</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Professional Links</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-400 mb-1">LinkedIn Profile</label>
                          <input
                            type="text"
                            value={links.linkedin}
                            onChange={(e) => setLinks({...links, linkedin: e.target.value})}
                            disabled={!isEditing}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1">Portfolio Website</label>
                          <input
                            type="text"
                            value={links.portfolio}
                            onChange={(e) => setLinks({...links, portfolio: e.target.value})}
                            disabled={!isEditing}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Career Interests</h3>
                      
                      <div className="mb-4">
                        <label className="block text-gray-400 mb-2">Job Types</label>
                        <div className="flex flex-wrap gap-2">
                          {jobTypeOptions.map((jobType) => (
                            <button
                              key={jobType}
                              onClick={() => isEditing && handleJobTypeToggle(jobType)}
                              disabled={!isEditing}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                careerInterests.jobTypes.includes(jobType)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:hover:bg-gray-700 disabled:opacity-50'
                              }`}
                            >
                              {jobType}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-400 mb-2">Work Types</label>
                        <div className="flex flex-wrap gap-2">
                          {workTypeOptions.map((workType) => (
                            <button
                              key={workType}
                              onClick={() => isEditing && handleWorkTypeToggle(workType)}
                              disabled={!isEditing}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                careerInterests.workTypes.includes(workType)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:hover:bg-gray-700 disabled:opacity-50'
                              }`}
                            >
                              {workType}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 mb-2">Preferred Locations</label>
                        <input
                          type="text"
                          value={careerInterests.locations}
                          onChange={(e) => setCareerInterests({...careerInterests, locations: e.target.value})}
                          disabled={!isEditing}
                          placeholder="e.g. New York, Remote, San Francisco"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-900/80 border border-green-500' : 'bg-red-900/80 border border-red-500'
        }`}>
          <p className={notification.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {notification.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;