import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  
  const navigate = useNavigate();

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
        resumeUrl: updatedResumeUrl,
        resumeAnalysis: analysis,
        updatedAt: new Date()
      });
      
      // Update local state
      setResumeUrl(updatedResumeUrl);
      setResumeFile(null);
      setResumeAnalysis(analysis);
      
      // Show success notification
      setNotification({
        show: true,
        message: "Profile updated successfully!",
        type: "success"
      });
      
      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
      
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

  const handleCancel = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-purple-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-900 text-white pt-8 pb-16"
    >
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft className="text-white" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Edit Profile</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center"
            >
              <FiX className="mr-2" />
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FiSave className="mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
        
        {/* Profile info section */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {userData?.fullName?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 font-medium">Full Name</label>
                <input
                  type="text"
                  value={userData?.fullName || ""}
                  onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <p className="text-gray-400 mb-2">{user?.email}</p>
            </div>
          </div>
        </motion.section>
        
        {/* Skills section */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg"
        >
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Skills</h3>
          
          {/* Display current skills with delete option */}
          <div className="mb-6">
            <p className="text-gray-300 mb-3 font-medium">Current Skills:</p>
            <div className="flex flex-wrap gap-2">
              {userData?.skills?.map((skill, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center shadow-sm"
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
              {(!userData?.skills || userData.skills.length === 0) && (
                <p className="text-gray-500 text-sm italic">No skills added yet. Add some skills below to highlight your expertise.</p>
              )}
            </div>
          </div>
          
          {/* Add new skills */}
          <div className="mt-6">
            <p className="text-gray-300 mb-3 font-medium">Add Skills:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {skillOptions
                .filter(skill => !userData?.skills?.includes(skill))
                .map((skill, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center shadow-sm"
                    onClick={() => {
                      const newSkills = [...(userData?.skills || []), skill];
                      setUserData({...userData, skills: newSkills});
                    }}
                  >
                    <span className="mr-1 text-purple-400">+</span> {skill}
                  </motion.button>
                ))
              }
            </div>
          </div>
          
          {/* Custom skill input */}
          <div className="mt-8">
            <p className="text-gray-300 mb-3 font-medium">Add Custom Skill:</p>
            <div className="flex">
              <input
                type="text"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none shadow-sm"
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
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white px-4 py-3 rounded-r-lg transition-all shadow-sm"
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
        </motion.section>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === 'success' ? 'bg-green-900/90 border border-green-500' : 'bg-red-900/90 border border-red-500'
          }`}
        >
          <p className={notification.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {notification.message}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EditProfile; 