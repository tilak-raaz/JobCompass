// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pdf = require('pdf-parse');

admin.initializeApp();

// New function that handles the resume processing asynchronously
exports.processResumeQueue = functions.firestore
  .document('resumeQueue/{docId}')
  .onCreate(async (snapshot) => {
    const data = snapshot.data();
    const { userId, fileUrl, fileName, status } = data;
    
    // Exit if already being processed
    if (status !== 'pending') {
      return null;
    }
    
    // Update status to processing
    await snapshot.ref.update({
      status: 'processing',
      processingStartTime: admin.firestore.FieldValue.serverTimestamp()
    });
    
    try {
      // Extract file path from URL
      const filePathMatch = fileUrl.match(/o\/(.+)\?/);
      if (!filePathMatch) {
        throw new Error('Invalid file URL format');
      }
      
      const filePath = decodeURIComponent(filePathMatch[1]);
      const bucket = admin.storage().bucket();
      
      // Download the file
      const tempFilePath = path.join(os.tmpdir(), fileName);
      await bucket.file(filePath).download({ destination: tempFilePath });
      
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(tempFilePath);
      let resumeText;
      
      try {
        const pdfData = await pdf(dataBuffer);
        resumeText = pdfData.text;
      } catch (pdfError) {
        console.error('Error extracting PDF text:', pdfError);
        resumeText = `The resume can be found at: ${fileUrl}`;
      }
      
      // Call OpenAI API with retry logic
      let openaiResponse = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !openaiResponse) {
        try {
          openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: "gpt-4-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a professional resume enhancer. Analyze the resume and provide specific improvements to make it more attractive to employers."
                },
                {
                  role: "user",
                  content: `Enhance this resume. ${resumeText}`
                }
              ],
              max_tokens: 2000
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${functions.config().openai.key}`
              }
            }
          );
        } catch (apiError) {
          attempts++;
          console.error(`OpenAI API error (attempt ${attempts}):`, apiError.message);
          // Wait before retrying
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          } else {
            throw apiError;
          }
        }
      }
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      // Save enhancement result
      const enhancedResume = openaiResponse.data.choices[0].message.content;
      
      // Update the queue document
      await snapshot.ref.update({
        status: 'completed',
        enhancedResume: enhancedResume,
        completionTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Also update user document
      await admin.firestore().collection('users').doc(userId).update({
        enhancedResume: enhancedResume,
        enhancedResumeDate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
      
    } catch (error) {
      console.error('Error processing resume:', error);
      
      // Update queue document with error
      await snapshot.ref.update({
        status: 'error',
        error: error.message,
        errorTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

// Client-facing function to initiate the process
exports.enhanceResume = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { fileUrl, fileName } = data;
    const userId = context.auth.uid;
    
    // Create a document in the queue collection
    const queueRef = await admin.firestore().collection('resumeQueue').add({
      userId: userId,
      fileUrl: fileUrl,
      fileName: fileName,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return the queue document ID for status checking
    return {
      success: true,
      queueId: queueRef.id,
      message: 'Resume enhancement process started'
    };
    
  } catch (error) {
    console.error('Error initiating resume enhancement:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to start resume enhancement. Please try again.',
      error.message
    );
  }
});

// Function to check the status of a resume enhancement
exports.checkResumeStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  try {
    const { queueId } = data;
    const queueDoc = await admin.firestore().collection('resumeQueue').doc(queueId).get();
    
    if (!queueDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Resume enhancement process not found'
      );
    }
    
    const queueData = queueDoc.data();
    
    // Check if the user is authorized to check this document
    if (queueData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Not authorized to check this resume enhancement status'
      );
    }
    
    return {
      status: queueData.status,
      enhancedResume: queueData.enhancedResume || null,
      error: queueData.error || null,
      createdAt: queueData.createdAt,
      completionTime: queueData.completionTime || null
    };
    
  } catch (error) {
    console.error('Error checking resume status:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to check resume status. Please try again.',
      error.message
    );
  }
});