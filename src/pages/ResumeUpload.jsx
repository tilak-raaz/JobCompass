import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadBytesResumable, getDownloadURL, ref } from 'firebase/storage';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { storage, db, auth } from '../firebase.config';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiArrowLeft, FiInfo, FiCheckCircle, FiAlertCircle, FiFileText, FiX } from 'react-icons/fi';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentResume, setCurrentResume] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  // Fetch user's current resume on component mount
  useEffect(() => {
    const fetchUserResume = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().resumeUrl) {
            setCurrentResume({
              url: userDoc.data().resumeUrl,
              name: userDoc.data().resumeFileName || 'Your current resume',
              updatedAt: userDoc.data().resumeUpdatedAt?.toDate() || new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching resume:', error);
        }
      }
    };
    
    fetchUserResume();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile) {
      // Check file type (PDF or DOC/DOCX)
      const fileType = selectedFile.type;
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(fileType)) {
        setError('Please upload a PDF or Word document');
        return false;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return false;
      }
      
      setFile(selectedFile);
      setError('');
      return true;
    }
    return false;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!auth.currentUser) {
      setError('You must be logged in to upload a resume');
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess(false);
    
    try {
      const user = auth.currentUser;
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `resume_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `resumes/${user.uid}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload resume. Please try again.');
          setUploading(false);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update user document with resume URL
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              resumeUrl: downloadURL,
              resumeFileName: file.name,
              resumeUpdatedAt: new Date()
            });
            
            setSuccess(true);
            // Update current resume data
            setCurrentResume({
              url: downloadURL,
              name: file.name,
              updatedAt: new Date()
            });
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } catch (error) {
            console.error('Firestore update error:', error);
            setError('Your resume was uploaded but we could not save it to your profile.');
          }
          
          setUploading(false);
        }
      );
    } catch (error) {
      console.error('Resume upload error:', error);
      setError('An unexpected error occurred. Please try again.');
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-900 text-white"
    >
      <div className="max-w-4xl mx-auto py-12 px-4">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"
        >
          Upload Your Resume
        </motion.h1>
        
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-center mb-8"
        >
          Let employers find you with a professional resume
        </motion.p>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl shadow-xl p-8 mb-8 border border-gray-700 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500 opacity-70"></div>
          
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-3/5">
              <motion.div className="mb-2 flex items-center">
                <FiInfo className="text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-200">Resume Guidelines</h2>
              </motion.div>
              
              <ul className="text-gray-300 mb-6 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Keep your resume up-to-date with your latest experience and skills
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Include relevant keywords for your industry to improve job matches
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  PDF format is preferred for consistent formatting across devices
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Maximum file size: 5MB
                </li>
              </ul>
              
              {currentResume && (
                <div className="mb-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center mb-2">
                    <FiFileText className="text-blue-400 mr-2" />
                    <h3 className="font-medium text-gray-200">Current Resume</h3>
                  </div>
                  <p className="text-sm text-gray-300 truncate mb-1">{currentResume.name}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    Last updated: {currentResume.updatedAt.toLocaleDateString()}
                  </p>
                  <a 
                    href={currentResume.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center"
                  >
                    View current resume
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-2/5">
              <div 
                className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-all relative overflow-hidden
                  ${isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-purple-500/70'}
                  ${file ? 'bg-gray-700/30' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="resume-upload" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <label 
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  {file ? (
                    <div className="relative">
                      <div className="bg-purple-500/20 p-4 rounded-full mb-4 inline-block">
                        <FiFileText className="h-10 w-10 text-purple-400" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile();
                        }}
                        className="absolute top-0 right-0 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                      <div>
                        <p className="text-purple-400 font-medium text-sm truncate max-w-[200px] mx-auto">
                          {file.name}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-700/70 p-4 rounded-full mb-4 inline-block">
                        <FiUpload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium">Drop file here or click to browse</p>
                        <p className="text-gray-500 text-xs mt-1">PDF or Word document (max 5MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start"
              >
                <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-900/30 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6 flex items-start"
              >
                <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />
                <p>Resume uploaded successfully! Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Uploading resume</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
                ></motion.div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex-1 flex items-center justify-center"
            >
              <FiArrowLeft className="mr-2" />
              Cancel
            </button>
            
            <motion.button
              onClick={handleUpload}
              disabled={!file || uploading}
              whileHover={{ scale: file && !uploading ? 1.02 : 1 }}
              whileTap={{ scale: file && !uploading ? 0.98 : 1 }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center shadow-md"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Upload Resume
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResumeUpload;