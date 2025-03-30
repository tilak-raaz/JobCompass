import { useState } from 'react';
import { motion } from 'framer-motion';
import JobApplicationTracker from '../components/JobApplicationTracker';

const ApplicationsPage = () => {
  const [activeTab, setActiveTab] = useState('tracker');

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      {/* Header */}
      <header className="bg-gray-900 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Job Applications
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tracker')}
                className={`${
                  activeTab === 'tracker'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Application Tracker
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'tracker' ? (
            <JobApplicationTracker />
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Application Analytics</h2>
              <p className="text-gray-300">
                Analytics features coming soon! Track your application success rate,
                interview performance, and more.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ApplicationsPage; 