const express = require('express');
const Multer = require('multer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const cors = require('cors');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
require('dotenv').config(); // Loads .env file from the server directory
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'backend-stuff-ee071.appspot.com'
});

const app = express();
app.use(cors());
app.use(express.json());

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const bucket = getStorage().bucket();

// Initialize OpenAI with the standard environment variable name
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Changed from VITE_OPENAI_API_KEY to OPENAI_API_KEY
});

// Debug log to check if API key is loaded (remove in production)
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper function to analyze resume with OpenAI API
async function analyzeResume(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert resume reviewer and career coach. Your task is to analyze the resume provided and offer specific, actionable improvements. Focus on:
            1. Content strength and impact of bullet points
            2. ATS optimization and keyword usage
            3. Format and layout suggestions
            4. Overall impression and positioning
            5. Specific rewritten examples of weak sections
            
            Structure your response with clear sections and provide both high-level strategic advice and specific tactical changes.`
        },
        {
          role: "user",
          content: `Please analyze this resume and provide detailed feedback for improvement:\n\n${resumeText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to analyze resume with AI');
  }
}

// Upload endpoint with resume analysis
app.post('/upload', multer.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const uid = req.body.uid;
    
    if (!file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }
    
    // 1. Upload file to Firebase Storage
    const blob = bucket.file(`resumes/${uid}/${file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    let fileError = null;
    blobStream.on('error', (err) => {
      fileError = err;
    });

    blobStream.on('finish', async () => {
      if (fileError) {
        return res.status(500).send({ error: fileError.message });
      }
      
      try {
        // 2. Get the file URL
        const [fileMetadata] = await blob.getMetadata();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        
        // 3. Extract text from PDF
        const resumeText = await extractTextFromPDF(file.buffer);
        
        // 4. Analyze the resume using OpenAI
        const analysisResult = await analyzeResume(resumeText);
        
        // 5. Send back both the file URL and analysis result
        res.status(200).send({ 
          url: publicUrl, 
          analysis: analysisResult
        });
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send({ error: error.message });
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Endpoint to analyze existing resume URL
app.post('/analyze-resume', async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).send({ error: 'No file URL provided' });
    }
    
    // 1. Get the file from Firebase storage
    const fileUrlPath = decodeURIComponent(fileUrl).split('storage.googleapis.com/')[1];
    const bucketName = fileUrlPath.split('/')[0];
    const filePath = fileUrlPath.replace(`${bucketName}/`, '');
    
    const file = bucket.file(filePath);
    const [fileExists] = await file.exists();
    
    if (!fileExists) {
      return res.status(404).send({ error: 'File not found' });
    }
    
    // 2. Download the file
    const [fileContent] = await file.download();
    
    // 3. Extract text from PDF
    const resumeText = await extractTextFromPDF(fileContent);
    
    // 4. Analyze the resume using OpenAI
    const analysisResult = await analyzeResume(resumeText);
    
    // 5. Send back the analysis result
    res.status(200).send({ analysis: analysisResult });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});