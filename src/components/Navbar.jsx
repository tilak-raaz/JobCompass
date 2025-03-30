import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase.config';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FiUpload, FiUser, FiSearch, FiList, FiEdit, FiLogOut, FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchClick = () => {
    navigate('/job-search');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-800 p-4 shadow-md relative z-30"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-white font-bold text-xl flex items-center">
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">SkillsScout</span>
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
          <div className="relative">
            <div
              onClick={toggleProfileMenu}
              className="flex items-center space-x-1 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 hover:border-purple-400 transition-colors flex items-center justify-center">
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
              <FiChevronDown className="text-white" />
            </div>
            
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-md shadow-xl z-50"
                >
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center"
                  >
                    <FiUser className="mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center"
                  >
                    <FiLogOut className="mr-2" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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