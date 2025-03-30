import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase.config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FiSearch, FiBookmark, FiClock } from 'react-icons/fi';

const JobDashboard = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch saved jobs
        const savedJobsQuery = query(
          collection(db, 'savedJobs'),
          where('userId', '==', auth.currentUser.uid)
        );
        const savedJobsSnapshot = await getDocs(savedJobsQuery);
        const savedJobsData = savedJobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedJobs(savedJobsData);

        // Fetch recent searches
        const searchHistoryQuery = query(
          collection(db, 'searchHistory'),
          where('userId', '==', auth.currentUser.uid)
        );
        const searchHistorySnapshot = await getDocs(searchHistoryQuery);
        const searchHistoryData = searchHistorySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        setRecentSearches(searchHistoryData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Find Your Next Opportunity</h2>
        <Link
          to="/job-search"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiSearch className="mr-2" />
          Start Job Search
        </Link>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FiClock className="mr-2" />
          Recent Searches
        </h2>
        {recentSearches.length > 0 ? (
          <div className="space-y-4">
            {recentSearches.map((search) => (
              <Link
                key={search.id}
                to={`/job-search?q=${encodeURIComponent(search.searchQuery)}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">{search.searchQuery}</div>
                <div className="text-sm text-gray-500">
                  {search.location && `Location: ${search.location}`}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent searches</p>
        )}
      </div>

      {/* Saved Jobs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FiBookmark className="mr-2" />
          Saved Jobs
        </h2>
        {savedJobs.length > 0 ? (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div key={job.id} className="p-4 border rounded-lg">
                <h3 className="font-medium">{job.title}</h3>
                <p className="text-gray-600">{job.company}</p>
                <p className="text-sm text-gray-500">{job.location}</p>
                <div className="mt-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Job
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No saved jobs</p>
        )}
      </div>
    </div>
  );
};

export default JobDashboard; 