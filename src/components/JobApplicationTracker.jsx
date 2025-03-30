import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase.config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    status: 'applied',
    dateApplied: new Date().toISOString().split('T')[0],
    notes: '',
    jobUrl: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'applications'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addApplication = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = await addDoc(collection(db, 'applications'), {
        ...newApplication,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });

      setApplications([...applications, { id: docRef.id, ...newApplication }]);
      setNewApplication({
        company: '',
        position: '',
        status: 'applied',
        dateApplied: new Date().toISOString().split('T')[0],
        notes: '',
        jobUrl: ''
      });
    } catch (error) {
      console.error('Error adding application:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, { status: newStatus });
      
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const deleteApplication = async (applicationId) => {
    try {
      await deleteDoc(doc(db, 'applications', applicationId));
      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-500',
      interviewing: 'bg-yellow-500',
      offered: 'bg-green-500',
      rejected: 'bg-red-500',
      accepted: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-t-purple-600 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Application Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-6 rounded-lg border border-gray-700"
      >
        <h2 className="text-xl font-bold mb-4">Add New Application</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Company Name"
            value={newApplication.company}
            onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Position"
            value={newApplication.position}
            onChange={(e) => setNewApplication({ ...newApplication, position: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="date"
            value={newApplication.dateApplied}
            onChange={(e) => setNewApplication({ ...newApplication, dateApplied: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={newApplication.status}
            onChange={(e) => setNewApplication({ ...newApplication, status: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
          <input
            type="text"
            placeholder="Job URL"
            value={newApplication.jobUrl}
            onChange={(e) => setNewApplication({ ...newApplication, jobUrl: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Notes"
            value={newApplication.notes}
            onChange={(e) => setNewApplication({ ...newApplication, notes: e.target.value })}
            className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={addApplication}
          className="mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2 rounded-md hover:opacity-90 transition duration-300"
        >
          Add Application
        </button>
      </motion.div>

      {/* Applications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold">Your Applications</h2>
        {applications.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-300">
            No applications tracked yet. Add your first application above!
          </div>
        ) : (
          applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{application.position}</h3>
                  <p className="text-gray-300">{application.company}</p>
                  <p className="text-sm text-gray-400">Applied: {new Date(application.dateApplied).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                  <select
                    value={application.status}
                    onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                  </select>
                  <button
                    onClick={() => deleteApplication(application.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              {application.notes && (
                <p className="mt-2 text-gray-300 text-sm">{application.notes}</p>
              )}
              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-purple-400 hover:text-purple-300 inline-block"
                >
                  View Job Posting →
                </a>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default JobApplicationTracker; 