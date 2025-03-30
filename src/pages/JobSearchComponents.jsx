import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, saveSearchHistory } from "../firebase.config";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import JobResults from '../components/JobResults';
import { FiSearch, FiFilter, FiX, FiCheck, FiMapPin } from 'react-icons/fi';
import { searchJobs } from '../services/googleJobsAPI';
import _ from 'lodash';

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

  // Create a ref for the debounced function
  const debouncedSearchRef = useRef();

  // Initialize the debounced search function
  useEffect(() => {
    debouncedSearchRef.current = _.debounce(async (searchQuery, selectedSkills, location) => {
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
            location
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

        console.log('Processed jobs with skill matching:', jobsWithSkillMatch);

        // Sort jobs by match score and date
        const sortedJobs = jobsWithSkillMatch.sort((a, b) => {
          // First sort by match score
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          // Then by date if available
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });

        setJobs(sortedJobs);
      } catch (error) {
        console.error("Search error:", error);
        setError(error.message || 'Failed to search jobs. Please try again.');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, []);

  // Effect to trigger search when relevant parameters change
  useEffect(() => {
    if (searchQuery.trim() || selectedSkills.length > 0) {
      debouncedSearchRef.current?.(searchQuery, selectedSkills, location);
    }
  }, [searchQuery, selectedSkills, location]);

  // Handle search button click
  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedSkills.length) {
      setError("Please enter a search term or select skills");
      setJobs([]);
      return;
    }
    
    setError(""); // Clear any previous errors
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchQuery, selectedSkills, location);
    }
  };

  // Handle skill selection without triggering search
  const handleSkillSelect = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Handle skill removal without triggering search
  const handleSkillRemove = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  // Effect to load user skills and trigger initial search
  useEffect(() => {
    fetchUserSkills();
  }, []);

  const fetchUserSkills = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.skills && userData.skills.length > 0) {
          setUserSkills(userData.skills);
          setSelectedSkills(userData.skills);
          // Automatically search for jobs with user's skills
          if (debouncedSearchRef.current) {
            debouncedSearchRef.current('', userData.skills, '');
          }
        }
        
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
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#242424]">
        <div className="w-12 h-12 border-4 border-t-purple-600 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      {/* Header with Gradient Background */}
      <header className="relative bg-gradient-to-r from-purple-900 to-blue-900 p-8 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05]"></div>
        <div className="relative max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Find Your Dream Job
          </h1>
          <p className="text-gray-300 text-lg">
            Search jobs by skills and get matched with the best opportunities
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <FiSearch />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Skills Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Your Skills</h2>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <FiX />
                Clear All
              </button>
            )}
          </div>

          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <motion.span
                    key={skill}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-purple-500 bg-opacity-20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => handleSkillRemove(skill)}
                      className="text-purple-300 hover:text-white transition-colors"
                    >
                      <FiX />
                    </button>
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* Available Skills */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredSkills.map((skill) => (
              <motion.button
                key={skill}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSkillSelect(skill)}
                className={`p-3 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedSkills.includes(skill)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {selectedSkills.includes(skill) ? <FiCheck /> : null}
                {skill}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Job Results */}
        <JobResults 
          selectedSkills={selectedSkills} 
          filters={filters} 
          jobs={jobs}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
};

export default JobSearchComponent;