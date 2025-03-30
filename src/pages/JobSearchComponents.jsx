import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, saveSearchHistory } from "../firebase.config";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import JobResults from '../components/JobResults';
import { FiSearch, FiFilter, FiX, FiCheck, FiMapPin, FiBriefcase, FiUser } from 'react-icons/fi';
import { searchJobs } from '../services/googleJobsAPI';
import _ from 'lodash';
import { Link, useNavigate } from 'react-router-dom';

const JobSearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [userSkills, setUserSkills] = useState([]);
  const [filters, setFilters] = useState({
    jobType: [],
    experience: [],
    salary: '',
    datePosted: 'any'
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Fetch user skills when component mounts
  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserSkills(userData.skills || []);
            setSelectedSkills(userData.skills || []);
            
            // Set available skills (combine user skills with common skills)
            const commonSkills = [
              'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL',
              'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Machine Learning',
              'Data Science', 'UI/UX', 'Project Management', 'Marketing',
              'Sales', 'Customer Service', 'Content Writing', 'SEO'
            ];
            
            const allSkills = [...new Set([...userData.skills || [], ...commonSkills])];
            setAvailableSkills(allSkills);
          }
        }
      } catch (error) {
        console.error('Error fetching user skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  const handleSearch = async (e) => {
    // Prevent default form submission behavior
    if (e) {
      e.preventDefault();
    }
    
    if (!searchQuery && !selectedSkills?.length) {
      setJobs([]);
      setError("Please enter a search term or select skills");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      // Save search to history
      if (auth.currentUser) {
        await saveSearchHistory(auth.currentUser.uid, searchQuery, {
          location,
          skills: selectedSkills
        });
      }

      // Use selected skills or search query
      const searchTerm = selectedSkills.length 
        ? selectedSkills.join(' ') 
        : searchQuery;

      const jobResults = await searchJobs(searchTerm, location);
      console.log('Received job results:', jobResults);

      if (!jobResults || jobResults.length === 0) {
        setError("No jobs found matching your criteria. Try broadening your search.");
        setJobs([]);
        return;
      }

      // Add skill matching
      const jobsWithSkillMatch = jobResults.map(job => {
        const matchedSkills = selectedSkills.filter(skill => {
          const skillLower = skill.toLowerCase();
          const textToSearch = [
            job.title,
            job.description,
            ...(job.requirements || []),
            ...(job.responsibilities || []),
            ...(job.highlights || []).flatMap(h => h.items || [])
          ].join(' ').toLowerCase();
          
          return textToSearch.includes(skillLower);
        });

        return {
          ...job,
          matchedSkills,
          matchScore: selectedSkills.length > 0 
            ? (matchedSkills.length / selectedSkills.length) * 100 
            : 100
        };
      });

      // Sort jobs by match score and date
      const sortedJobs = jobsWithSkillMatch.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return new Date(b.date) - new Date(a.date);
      });

      setJobs(sortedJobs);
    } catch (error) {
      console.error('Error searching jobs:', error);
      setError('Failed to search jobs. Please try again.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleTrackApplication = (job) => {
    // TODO: Implement job tracking functionality
    console.log('Tracking job:', job);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Custom Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-800 p-4 shadow-md"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-white font-bold text-xl flex items-center">
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">SkillsScout</span>
          </Link>
          
          {auth.currentUser && (
            <div
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 cursor-pointer hover:border-purple-400 transition-colors flex items-center justify-center"
            >
              {auth.currentUser.photoURL ? (
                <img
                  src={auth.currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-white text-xl" />
              )}
            </div>
          )}
        </div>
      </motion.nav>
      
      {/* Header with Gradient Background */}
      <header className="relative bg-gradient-to-r from-purple-900 to-blue-900 py-12 px-4 shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjQiPjxwYXRoIGQ9Ik0yOS41IDQ3LjVoMXYxaC0xek0yOS41IDQ2LjVoMXYxaC0xek0yOS41IDQ1LjVoMXYxaC0xek0yOS41IDQ0LjVoMXYxaC0xek0yOS41IDQzLjVoMXYxaC0xek0yOS41IDQyLjVoMXYxaC0xek0yOS41IDQxLjVoMXYxaC0xek0yOS41IDQwLjVoMXYxaC0xek0yOS41IDM5LjVoMXYxaC0xek0yOS41IDM4LjVoMXYxaC0xek0yOS41IDM3LjVoMXYxaC0xek0yOS41IDM2LjVoMXYxaC0xek0yOS41IDM1LjVoMXYxaC0xek0yOS41IDM0LjVoMXYxaC0xek0yOS41IDMzLjVoMXYxaC0xek0yOS41IDMyLjVoMXYxaC0xek0yOS41IDMxLjVoMXYxaC0xek0yOS41IDMwLjVoMXYxaC0xek0yOS41IDI5LjVoMXYxaC0xek0yOS41IDI4LjVoMXYxaC0xek0yOS41IDI3LjVoMXYxaC0xek0yOS41IDI2LjVoMXYxaC0xek0yOS41IDI1LjVoMXYxaC0xek0yOS41IDI0LjVoMXYxaC0xek0yOS41IDIzLjVoMXYxaC0xek0yOS41IDIyLjVoMXYxaC0xek0yOS41IDIxLjVoMXYxaC0xek0yOS41IDIwLjVoMXYxaC0xek0yOS41IDE5LjVoMXYxaC0xek0yOS41IDE4LjVoMXYxaC0xek0yOS41IDE3LjVoMXYxaC0xek0yOS41IDE2LjVoMXYxaC0xek0yOS41IDE1LjVoMXYxaC0xek0yOS41IDE0LjVoMXYxaC0xek0yOS41IDEzLjVoMXYxaC0xek0yOS41IDEyLjVoMXYxaC0xek0yOS41IDExLjVoMXYxaC0xek0zMC41IDQ3LjVoMXYxaC0xek0zMC41IDQ2LjVoMXYxaC0xek0zMC41IDQ1LjVoMXYxaC0xek0zMC41IDQ0LjVoMXYxaC0xek0zMC41IDQzLjVoMXYxaC0xek0zMC41IDQyLjVoMXYxaC0xek0zMC41IDQxLjVoMXYxaC0xek0zMC41IDQwLjVoMXYxaC0xek0zMC41IDM5LjVoMXYxaC0xek0zMC41IDM4LjVoMXYxaC0xek0zMC41IDM3LjVoMXYxaC0xek0zMC41IDM2LjVoMXYxaC0xek0zMC41IDM1LjVoMXYxaC0xek0zMC41IDM0LjVoMXYxaC0xek0zMC41IDMzLjVoMXYxaC0xek0zMC41IDMyLjVoMXYxaC0xek0zMC41IDMxLjVoMXYxaC0xek0zMC41IDMwLjVoMXYxaC0xek0zMC41IDI5LjVoMXYxaC0xek0zMC41IDI4LjVoMXYxaC0xek0zMC41IDI3LjVoMXYxaC0xek0zMC41IDI2LjVoMXYxaC0xek0zMC41IDI1LjVoMXYxaC0xek0zMC41IDI0LjVoMXYxaC0xek0zMC41IDIzLjVoMXYxaC0xek0zMC41IDIyLjVoMXYxaC0xek0zMC41IDIxLjVoMXYxaC0xek0zMC41IDIwLjVoMXYxaC0xek0zMC41IDE5LjVoMXYxaC0xek0zMC41IDE4LjVoMXYxaC0xek0zMC41IDE3LjVoMXYxaC0xek0zMC41IDE2LjVoMXYxaC0xek0zMC41IDE1LjVoMXYxaC0xek0zMC41IDE0LjVoMXYxaC0xek0zMC41IDEzLjVoMXYxaC0xek0zMC41IDEyLjVoMXYxaC0xek0zMC41IDExLjVoMXYxaC0xeiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Find Your Dream Job
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl">
              Search for jobs that match your skills and experience. Get personalized job recommendations based on your profile.
            </p>
          </motion.div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-400"
                />
              </div>
              <div className="flex-1 relative">
                <FiMapPin className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location (city, state, or remote)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <FiSearch className="text-lg" />
                    <span>Search Jobs</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FiFilter />
                <span>Filters</span>
              </button>
            </div>
            
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700"
              >
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Job Type</label>
                  <div className="space-y-2">
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                      <label key={type} className="flex items-center gap-2 text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.jobType.includes(type)}
                          onChange={() => {
                            setFilters(prev => ({
                              ...prev,
                              jobType: prev.jobType.includes(type)
                                ? prev.jobType.filter(t => t !== type)
                                : [...prev.jobType, type]
                            }));
                          }}
                          className="rounded text-purple-500 focus:ring-purple-500 bg-gray-700 border-gray-600"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Experience Level</label>
                  <div className="space-y-2">
                    {['Entry-level', 'Mid-level', 'Senior', 'Executive'].map(exp => (
                      <label key={exp} className="flex items-center gap-2 text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.experience.includes(exp)}
                          onChange={() => {
                            setFilters(prev => ({
                              ...prev,
                              experience: prev.experience.includes(exp)
                                ? prev.experience.filter(e => e !== exp)
                                : [...prev.experience, exp]
                            }));
                          }}
                          className="rounded text-purple-500 focus:ring-purple-500 bg-gray-700 border-gray-600"
                        />
                        {exp}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date Posted</label>
                  <select
                    value={filters.datePosted}
                    onChange={(e) => setFilters(prev => ({ ...prev, datePosted: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="any">Any time</option>
                    <option value="day">Past 24 hours</option>
                    <option value="week">Past week</option>
                    <option value="month">Past month</option>
                  </select>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Skills Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Skills</h2>
            {selectedSkills.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSkills([])}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <FiX />
                <span>Clear All</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedSkills.includes(skill)
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                {selectedSkills.includes(skill) && (
                  <FiCheck className="inline-block mr-1 text-xs" />
                )}
                {skill}
              </motion.button>
            ))}
          </div>
          {selectedSkills.length > 0 && (
            <p className="mt-4 text-sm text-gray-400">
              Showing jobs matching {selectedSkills.length} selected skill{selectedSkills.length > 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* Job Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <JobResults 
            jobs={jobs}
            isLoading={isLoading}
            error={error}
            selectedSkills={selectedSkills}
            filters={filters}
            onTrackApplication={handleTrackApplication}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default JobSearchComponent;