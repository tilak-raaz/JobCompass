import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiBriefcase, FiDollarSign, FiExternalLink, FiSearch } from 'react-icons/fi';

const JobResults = ({ selectedSkills = [], filters, jobs = [], isLoading, error }) => {
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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Searching for jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <FiSearch className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-500 font-semibold mb-2">Search Error</h3>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!isLoading && sortedJobs.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <FiSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
        <p className="text-gray-400">
          Try adjusting your search terms or removing some filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">
          Found {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="relevance">Sort by Relevance</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {sortedJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-gray-400">{job.company}</p>
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
                    {job.via && (
                      <span className="text-gray-500">
                        {job.via}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply Now
                  <FiExternalLink />
                </a>
              </div>

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
                    className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                  >
                    {expandedJob === job.id ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {selectedSkills.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-400">Skills Match:</p>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {Math.round(job.matchScore || 0)}%
                    </span>
                  </div>
                  {job.matchedSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.matchedSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {job.requirements?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Key Requirements:</p>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Benefits:</p>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobResults; 