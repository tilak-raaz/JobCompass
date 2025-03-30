import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiBriefcase, FiDollarSign, FiExternalLink, FiSearch, FiBookmark, FiStar, FiTrendingUp } from 'react-icons/fi';

const JobResults = ({ selectedSkills = [], filters, jobs = [], isLoading, error, onTrackApplication }) => {
  const [sortBy, setSortBy] = useState('relevance');
  const [expandedJob, setExpandedJob] = useState(null);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    }
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 border-4 border-t-purple-600 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg">Finding the perfect jobs for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <FiSearch className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl text-red-500 font-semibold mb-2">Search Error</h3>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!isLoading && sortedJobs.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-10 text-center border border-gray-700">
        <FiSearch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-3">No Jobs Found</h3>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Try adjusting your search terms, changing location, or removing some filters
        </p>
      </div>
    );
  }

  // Function to render match score
  const renderMatchScore = (score) => {
    let colorClass = 'bg-red-500';
    if (score >= 80) colorClass = 'bg-green-500';
    else if (score >= 50) colorClass = 'bg-yellow-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium">
          {Math.round(score)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-300">
          Found <span className="text-white font-medium">{sortedJobs.length}</span> job{sortedJobs.length !== 1 ? 's' : ''}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="relevance">Sort by Relevance</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {sortedJobs.map((job, index) => (
            <motion.div
              key={job.id || `job-${index}-${Date.now()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
            >
              {/* Job header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {job.title}
                  </h3>
                  <p className="text-purple-400 font-medium">{job.company}</p>
                  
                  {/* Job meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-2">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <FiMapPin className="text-purple-500" />
                        {job.location}
                      </span>
                    )}
                    {job.type && (
                      <span className="flex items-center gap-1">
                        <FiBriefcase className="text-purple-500" />
                        {job.type}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <FiDollarSign className="text-purple-500" />
                        {job.salary}
                      </span>
                    )}
                    {job.date && (
                      <span className="flex items-center gap-1">
                        <FiClock className="text-purple-500" />
                        {new Date(job.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onTrackApplication(job)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FiBookmark />
                    Track
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Apply
                    <FiExternalLink />
                  </a>
                </div>
              </div>

              {/* Match score */}
              {selectedSkills.length > 0 && (
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTrendingUp className="text-purple-400" />
                    <p className="text-sm text-gray-300 font-medium">Skills Match</p>
                  </div>
                  {renderMatchScore(job.matchScore || 0)}
                  
                  {job.matchedSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.matchedSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium"
                        >
                          <FiStar className="inline-block mr-1 text-purple-400" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Job description */}
              <div className="mt-4">
                <div 
                  className={`text-gray-300 ${
                    expandedJob === job.id ? '' : 'line-clamp-3'
                  }`}
                >
                  {job.description}
                </div>
                {job.description && (
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    className="text-purple-400 hover:text-purple-300 text-sm mt-2 font-medium"
                  >
                    {expandedJob === job.id ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Requirements and benefits */}
              {expandedJob === job.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  {job.requirements?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-white font-medium mb-2">Key Requirements:</p>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 pl-2">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="text-gray-300">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.benefits?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-white font-medium mb-2">Benefits:</p>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 pl-2">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-300">{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobResults;