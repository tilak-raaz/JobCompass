import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FiUpload, FiUser, FiSearch, FiList, FiEdit } from 'react-icons/fi';

const Navbar = () => {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/job-search');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-800 p-4 shadow-md"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-white font-bold text-xl flex items-center">
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">JobCompass</span>
        </Link>
        
        <div className="hidden md:flex space-x-6">
          <button
            onClick={handleSearchClick}
            className={`flex items-center text-white hover:text-purple-400 transition-colors ${
              location.pathname === '/job-search' ? 'text-purple-400' : ''
            }`}
          >
            <FiSearch className="mr-2" />
            Search Jobs
          </button>

          <Link
            to="/resume"
            className={`flex items-center text-white hover:text-purple-400 transition-colors ${
              location.pathname === '/resume' ? 'text-purple-400' : ''
            }`}
          >
            <FiUpload className="mr-2" />
            Upload Resume
          </Link>
          
          <Link
            to="/applications"
            className={`flex items-center text-white hover:text-purple-400 transition-colors ${
              location.pathname === '/applications' ? 'text-purple-400' : ''
            }`}
          >
            <FiList className="mr-2" />
            Applications
          </Link>
          
          <button
            onClick={handleEditProfile}
            className={`flex items-center text-white hover:text-purple-400 transition-colors ${
              location.pathname === '/edit-profile' ? 'text-purple-400' : ''
            }`}
          >
            <FiEdit className="mr-2" />
            Edit Profile
          </button>
        </div>
        
        {user && (
          <div
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 cursor-pointer hover:border-purple-400 transition-colors flex items-center justify-center"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-white text-xl" />
            )}
          </div>
        )}
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-4">
          <button
            onClick={handleSearchClick}
            className="text-white hover:text-purple-400"
          >
            <FiSearch className="w-6 h-6" />
          </button>
          
          <Link to="/resume" className="text-white hover:text-purple-400">
            <FiUpload className="w-6 h-6" />
          </Link>
          
          <Link to="/applications" className="text-white hover:text-purple-400">
            <FiList className="w-6 h-6" />
          </Link>
          
          <button
            onClick={handleEditProfile}
            className="text-white hover:text-purple-400"
          >
            <FiEdit className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;