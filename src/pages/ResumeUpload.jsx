import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase.config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '../components/Navbar';
import { saveUserData } from '../utils/firebaseHelpers';

// Define the proxy server URL
const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3000';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState(null);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Check if file is PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!auth.currentUser) {
      setError('Please log in to upload a resume');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      const userId = auth.currentUser.uid;
      
      // Create form data for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', userId);
      
      // Upload file and get analysis in one step using the proxy server
      setProcessingStatus('Uploading and analyzing your resume...');
      setUploadProgress(30);
      
      const response = await fetch(`${PROXY_SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload and analyze resume');
      }
      
      setUploadProgress(70);
      
      const resultData = await response.json();
      const { url: downloadURL, analysis } = resultData;
      
      // Save file reference in Firestore
      await saveUserData(userId, {
        resumeURL: downloadURL,
        resumeFileName: fileName,
        resumeUploadDate: new Date(),
        resumeAnalyzed: true,
      });
      
      setUploadProgress(100);
      setIsUploading(false);
      
      // Set the analysis result
      setEnhancementResult(analysis);
      
    } catch (error) {
      console.error("Error uploading and analyzing file:", error);
      setError('Failed to process your resume. Please try again.');
      setIsUploading(false);
      setProcessingStatus('');
    }
  };

  const cancelProcessing = () => {
    setIsProcessing(false);
    setProcessingStatus('');
    setError('Processing canceled by user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Background blur effect with colorful lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-40 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-10 right-20 w-72 h-72 bg-green-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Overlay with backdrop filter for better text readability */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-6">Enhance Your Resume with AI</h1>
              <p className="text-gray-200 mb-8">Upload your resume and let our AI analyze and improve it to increase your chances of landing your dream job.</p>
              
              {/* Upload area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-all ${file ? 'border-green-400 bg-green-400/10' : 'border-gray-400 hover:border-blue-400 bg-white/5'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h12v12"></path>
                    </svg>
                    <p className="mt-4 text-gray-200">Drag and drop your resume here, or</p>
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                    >
                      Browse files
                    </button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <p className="mt-2 text-sm text-gray-400">PDF files only, max 5MB</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-green-200 font-medium">{fileName}</p>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setFileName('');
                      }}
                      className="mt-2 text-sm text-red-300 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-md">
                  <p className="text-red-200">{error}</p>
                </div>
              )}
              
              {isUploading && (
                <div className="mb-6">
                  <p className="text-gray-200 mb-2">{processingStatus} {uploadProgress}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">This may take up to a minute. Please don't close this page.</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`px-6 py-3 rounded-md text-white font-medium text-lg transition-colors ${(!file || isUploading) ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'}`}
                >
                  {isUploading ? 'Processing...' : 'Enhance My Resume'}
                </button>
              </div>
              
              {/* Results section */}
              {enhancementResult && (
                <div className="mt-12 bg-white/10 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">AI Enhancement Results</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-white/5 rounded-md p-6 text-gray-200">
                      {enhancementResult.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4 justify-between">
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(enhancementResult);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        // Download as text file
                        const element = document.createElement("a");
                        const file = new Blob([enhancementResult], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = "enhanced_resume_feedback.txt";
                        document.body.appendChild(element);
                        element.click();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-md text-white font-medium transition-colors"
                    >
                      Download Feedback
                    </button>
                    <button
                      onClick={() => {
                        // Reset the enhancement process
                        setEnhancementResult(null);
                        setFile(null);
                        setFileName('');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
              
              {/* Features section */}
              {!enhancementResult && !isUploading && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">GPT-4 Analysis</h3>
                    <p className="text-gray-300">Our advanced AI analyzes your resume against top industry standards and provides detailed, personalized feedback.</p>
                  </div>
                  
                  <div className="bg-white/5 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Instant Improvements</h3>
                    <p className="text-gray-300">Get specific rewrites for weak sections and actionable suggestions to make your resume stand out.</p>
                  </div>
                  
                  <div className="bg-white/5 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ATS Optimization</h3>
                    <p className="text-gray-300">Ensure your resume passes through Applicant Tracking Systems with proper keyword optimization and formatting advice.</p>
                  </div>
                </div>
              )}
              
              <div className="mt-8 text-sm text-gray-400 text-center">
                <p>Your resume is processed securely using OpenAI's GPT-4. We don't store the content of your resume permanently.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;