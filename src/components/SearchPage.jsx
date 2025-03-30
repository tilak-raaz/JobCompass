import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import JobResults from './JobResults';
import { searchJobs } from '../services/jobAPI';
import JobApplicationTracker from './JobApplicationTracker';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchJobs(query, location);
      
      // If skills are selected, calculate match scores
      if (selectedSkills.length > 0) {
        results.forEach(job => {
          // Calculate match score based on job description and requirements
          const description = job.description.toLowerCase();
          const matchedSkills = selectedSkills.filter(skill => 
            description.includes(skill.toLowerCase())
          );
          
          job.matchedSkills = matchedSkills;
          job.matchScore = (matchedSkills.length / selectedSkills.length) * 100;
        });
      }
      
      setJobs(results);
    } catch (err) {
      setError(err.message || 'Failed to search jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleTrackApplication = (job) => {
    setShowTracker(true);
    // You could pass the job data to the JobApplicationTracker here
    // or store it in state/context for access in the tracker
  };

  // Common skills for job seekers
  const commonSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 
    'SQL', 'AWS', 'Docker', 'Git', 'TypeScript'
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {!showTracker ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
          >
            <h1 className="text-2xl font-bold text-white mb-4">Find Your Next Job</h1>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="query" className="block text-sm text-gray-400 mb-1">Job Title, Keywords, or Company</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      id="query"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Software Engineer, Marketing"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <label htmlFor="location" className="block text-sm text-gray-400 mb-1">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Remote, New York, San Francisco"
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Select Your Skills (Optional)</p>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Search Jobs
              </button>
            </form>
          </motion.div>
          
          {(isLoading || error || jobs.length > 0) && (
            <JobResults
              selectedSkills={selectedSkills}
              jobs={jobs}
              isLoading={isLoading}
              error={error}
              onTrackApplication={handleTrackApplication}
            />
          )}
        </>
      ) : (
        <div>
          <button 
            onClick={() => setShowTracker(false)}
            className="mb-4 flex items-center text-purple-400 hover:text-purple-300"
          >
            ← Back to Search Results
          </button>
          <JobApplicationTracker />
        </div>
      )}
    </div>
  );
};

export default SearchPage;