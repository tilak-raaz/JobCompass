import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, storage } from "../firebase.config";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";

const Dashboard = () => {
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
      <div className="flex items-center justify-center min-h-screen bg-[#242424]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </motion.div>
      )}
      
      <header className="bg-gray-900 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Job Compass
          </Link>
          
          <nav className="flex space-x-4">
            <Link
              to="/job-search"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Search
            </Link>
            <button
              onClick={() => {
                setIsEditing(true);
                setActiveTab("profile");
                window.scrollTo(0, 0);
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Update Profile
            </button>
            <button
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <nav className="border-b border-gray-700 mb-6">
          <ul className="flex gap-6">
            <li>
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-2 ${
                  activeTab === "profile"
                    ? "text-purple-500 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("resume")}
                className={`pb-2 ${
                  activeTab === "resume"
                    ? "text-purple-500 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Resume
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("personal-branding")}
                className={`pb-2 ${
                  activeTab === "personal-branding"
                    ? "text-purple-500 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Personal Branding
              </button>
            </li>
          </ul>
        </nav>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg relative overflow-hidden
          before:w-24 before:h-24 before:absolute before:bg-purple-600 before:rounded-full before:-z-10 before:blur-2xl before:opacity-20
          after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-64 after:-right-12 after:opacity-20">
          
          {activeTab === "profile" && userData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img 
                    src={userData.profilePicture || "https://via.placeholder.com/100"} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.fullName}
                      onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-2xl font-bold w-full mb-2"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{userData.fullName}</h2>
                  )}
                  <p className="text-gray-300">{userData.email}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-purple-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V3z" />
                    </svg>
                    Skills
                  </h3>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {userData.skills && userData.skills.map((skill, index) => (
                          <motion.div 
                            key={index}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-purple-500/30 shadow-sm"
                          >
                            {skill}
                            <button
                              onClick={() => {
                                const newSkills = userData.skills.filter((_, i) => i !== index);
                                setUserData({ ...userData, skills: newSkills });
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-full"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Type a skill and press Enter"
                            className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500/50 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 backdrop-blur-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                const newSkill = e.target.value.trim();
                                if (!userData.skills?.includes(newSkill)) {
                                  const newSkills = [...(userData.skills || []), newSkill];
                                  setUserData({ ...userData, skills: newSkills });
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-xs text-gray-400">Press Enter ↵</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                            Suggested Skills
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {skillOptions
                              .filter(skill => !userData.skills?.includes(skill))
                              .map((skill, index) => (
                                <motion.button
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => {
                                    const newSkills = [...(userData.skills || []), skill];
                                    setUserData({ ...userData, skills: newSkills });
                                  }}
                                  className="bg-gray-700/50 hover:bg-gray-600/50 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2 group border border-gray-600/50 hover:border-purple-500/50 backdrop-blur-sm"
                                >
                                  <span className="text-purple-400 group-hover:text-purple-300">+</span>
                                  {skill}
                                </motion.button>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2"
                    >
                      {userData.skills && userData.skills.map((skill, index) => (
                        <motion.span 
                          key={index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-purple-500/30 shadow-sm"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-end mt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Resume Tab */}
          {activeTab === "resume" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Resume</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-all"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="p-4 border border-dashed border-gray-600 rounded-lg">
                  {resumeUrl ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-lg">Resume uploaded</span>
                        </div>
                        {isEditing && (
                          <p className="text-sm text-gray-400 mt-2">Upload a new file to replace your current resume</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-all"
                        >
                          View
                        </a>
                        {isEditing && (
                          <input
                            type="file"
                            onChange={handleResumeChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600 text-gray-300 text-sm rounded-md"
                            accept=".pdf,.docx"
                          />
                        )}
                      </div>
                    </div>
                  ) : isEditing ? (
                    <div className="text-center p-6">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="mb-3 text-gray-300">Drag and drop your resume or click to browse</p>
                      <input
                        type="file"
                        onChange={handleResumeChange}
                        className="mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600 text-gray-300 text-sm rounded-md"
                        accept=".pdf,.docx"
                      />
                      <p className="mt-2 text-xs text-gray-400">Supported formats: PDF, DOCX</p>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-300">No resume uploaded yet</p>
                      <p className="mt-2 text-sm text-gray-400">Click edit to upload your resume</p>
                    </div>
                  )}
                </div>
                
                {resumeAnalysis && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-purple-300">AI Resume Analysis</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-300 mb-2">Strengths</h4>
                        <ul className="space-y-2">
                          {resumeAnalysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-300 mb-2">Suggestions for Improvement</h4>
                        <ul className="space-y-2">
                          {resumeAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Personal Branding Tab - Completing this section */}
          {activeTab === "personal-branding" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Personal Branding</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-all"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-purple-300">LinkedIn Profile</h3>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={links.linkedin}
                        onChange={(e) => setLinks({...links, linkedin: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-white"
                        placeholder="https://linkedin.com/in/yourusername"
                      />
                    </div>
                  ) : (
                    <div>
                      {links.linkedin ? (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          <a 
                            href={links.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {links.linkedin}
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400">No LinkedIn profile added</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-purple-300">Portfolio / Website</h3>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={links.portfolio}
                        onChange={(e) => setLinks({...links, portfolio: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-white"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  ) : (
                    <div>
                      {links.portfolio ? (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-3a1 1 0 112 0v-2h2a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <a 
                            href={links.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-400 hover:underline"
                          >
                            {links.portfolio}
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400">No portfolio website added</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-700 bg-opacity-40 p-4 rounded-lg mt-6">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-white mb-1">Why add your profiles?</h4>
                      <p className="text-gray-300 text-sm">
                        Adding your LinkedIn and portfolio links helps employers and recruiters find your full professional profile. 
                        It increases your visibility in search results and makes it easier for potential connections to reach out.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Personal brand development tips */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3 text-purple-300">Personal Brand Development Tips</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 bg-opacity-30 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      LinkedIn Optimization
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        Use a professional profile photo and cover image
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        Craft a compelling headline that includes keywords
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        Write an engaging summary that showcases your unique value
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        Request recommendations from colleagues and managers
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 bg-opacity-30 p-4 rounded-lg">
                    <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      Portfolio Best Practices
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        Showcase your best and most relevant work
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        Include case studies with problems and solutions
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        Keep design clean, simple, and easy to navigate
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        Ensure it's mobile-responsive and loads quickly
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 bg-purple-900 bg-opacity-20 p-4 rounded-lg border border-purple-700 border-opacity-30">
                  <h4 className="font-medium text-purple-300 mb-2">Pro Tip: Consistency is Key</h4>
                  <p className="text-sm text-gray-300">
                    Maintain a consistent personal brand across all platforms. Use the same profile photo,
                    similar descriptions, and keep your information up-to-date everywhere. This helps build
                    recognition and trust with potential employers and connections.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;