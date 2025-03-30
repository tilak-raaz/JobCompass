import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FiSave, FiPlus, FiX, FiCheck } from "react-icons/fi";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    location: "",
    bio: "",
    skills: [],
    jobTypes: [],
    workTypes: [],
  });
  
  // Skill input state
  const [skillInput, setSkillInput] = useState("");
  
  // Available options
  const skillSuggestions = [
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
  
  const jobTypeOptions = ["Tech", "Marketing", "Sales", "Design", "Finance", "HR", "Operations", "Other"];
  const workTypeOptions = ["Full-time", "Part-time", "Contract", "Remote", "Hybrid", "On-site"];

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        navigate("/signin");
        return;
      }
      
      try {
        // Check if user already has a profile
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().profileCompleted) {
          // Profile already completed, redirect to dashboard
          navigate("/dashboard");
          return;
        }
        
        // Pre-fill form data if it exists
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(prevData => ({
            ...prevData,
            fullName: userData.fullName || "",
            jobTitle: userData.jobTitle || "",
            location: userData.location || "",
            bio: userData.bio || "",
            skills: userData.skills || [],
            jobTypes: userData.jobTypes || [],
            workTypes: userData.workTypes || [],
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking user profile:", error);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const addSkill = (skill) => {
    if (!skill.trim()) return;
    
    // Prevent duplicates
    if (!formData.skills.includes(skill)) {
      setFormData(prevData => ({
        ...prevData,
        skills: [...prevData.skills, skill]
      }));
    }
    
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setFormData(prevData => ({
      ...prevData,
      skills: prevData.skills.filter(s => s !== skill)
    }));
  };

  const toggleJobType = (type) => {
    setFormData(prevData => {
      if (prevData.jobTypes.includes(type)) {
        return {
          ...prevData,
          jobTypes: prevData.jobTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prevData,
          jobTypes: [...prevData.jobTypes, type]
        };
      }
    });
  };

  const toggleWorkType = (type) => {
    setFormData(prevData => {
      if (prevData.workTypes.includes(type)) {
        return {
          ...prevData,
          workTypes: prevData.workTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prevData,
          workTypes: [...prevData.workTypes, type]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      // Validate form
      if (!formData.fullName.trim()) {
        throw new Error("Please enter your name");
      }
      
      // Save user profile
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        email: user.email,
        photoURL: user.photoURL || "",
        profileCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
      setSuccess(true);
      
      // Wait for success animation, then redirect
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-purple-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Complete Your Profile
        </h1>
        <p className="text-gray-400 mb-8">
          Let's set up your profile so we can personalize your job search experience.
        </p>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6"
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded-md mb-6 flex items-center"
          >
            <FiCheck className="mr-2 text-xl" />
            Profile saved successfully! Redirecting to dashboard...
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <section className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-gray-300 mb-2">Professional Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="A brief description about yourself and your career"
              ></textarea>
            </div>
          </section>
          
          {/* Skills Section */}
          <section className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Skills</h2>
            <p className="text-gray-400 mb-4">Add skills to improve your job matches</p>
            
            <div className="flex mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="Enter a skill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="bg-purple-600 hover:bg-purple-700 px-4 rounded-r-lg flex items-center"
              >
                <FiPlus />
              </button>
            </div>
            
            {/* Skills suggestions */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Suggested skills:</p>
              <div className="flex flex-wrap gap-2">
                {skillSuggestions.filter(skill => !formData.skills.includes(skill)).slice(0, 10).map((skill, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 border border-gray-600"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Selected skills */}
            {formData.skills.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Your skills:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="group px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full text-sm text-white flex items-center">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center opacity-70 hover:opacity-100"
                      >
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
          
          {/* Preferences Section */}
          <section className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Job Preferences</h2>
            
            {/* Job Types */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Job Types</label>
              <div className="flex flex-wrap gap-2">
                {jobTypeOptions.map((type, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleJobType(type)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      formData.jobTypes.includes(type)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Work Types */}
            <div>
              <label className="block text-gray-300 mb-2">Work Types</label>
              <div className="flex flex-wrap gap-2">
                {workTypeOptions.map((type, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWorkType(type)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      formData.workTypes.includes(type)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </section>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || success}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage; 