import axios from 'axios';

const API_URL = 'https://google-jobs-scraper2.p.rapidapi.com/';
const API_KEY = 'ad8ad81740msh8070d127e0c5d83p127800jsn4e6ee2678ca1';

// Mock data for testing
const mockJobs = [
  {
    job_id: 'mock_1',
    title: 'Senior Software Engineer',
    company_name: 'Tech Solutions Inc.',
    location: 'San Francisco, CA',
    description: 'We are looking for an experienced software engineer to join our team. The ideal candidate will have strong experience with React, Node.js, and cloud technologies.',
    extensions: ['2 days ago', 'Full-time', '$120K - $150K', 'Health insurance', 'Dental insurance'],
    job_highlights: [
      {
        title: 'Qualifications',
        items: [
          '5+ years of experience with modern JavaScript frameworks',
          'Strong experience with React and Node.js',
          'Experience with cloud platforms (AWS, GCP, or Azure)',
          'Bachelor\'s degree in Computer Science or related field'
        ]
      },
      {
        title: 'Benefits',
        items: [
          'Competitive salary and equity package',
          'Comprehensive health insurance',
          '401(k) matching',
          'Flexible work hours and remote work options'
        ]
      },
      {
        title: 'Responsibilities',
        items: [
          'Design and implement new features',
          'Write clean, maintainable code',
          'Collaborate with cross-functional teams',
          'Mentor junior developers'
        ]
      }
    ],
    apply_options: [
      { title: 'Apply Now', link: '#' }
    ]
  },
  {
    job_id: 'mock_2',
    title: 'Full Stack Developer',
    company_name: 'Digital Innovations',
    location: 'Remote',
    description: 'Join our fast-growing startup as a Full Stack Developer. We need someone who can work across the entire stack and help us build scalable solutions.',
    extensions: ['1 day ago', 'Full-time', '$90K - $120K', 'Remote', 'Flexible hours'],
    job_highlights: [
      {
        title: 'Qualifications',
        items: [
          '3+ years of full stack development experience',
          'Experience with Python and JavaScript',
          'Knowledge of SQL and NoSQL databases',
          'Experience with Docker and Kubernetes'
        ]
      },
      {
        title: 'Benefits',
        items: [
          'Remote-first culture',
          'Competitive salary',
          'Unlimited PTO',
          'Learning and development budget'
        ]
      },
      {
        title: 'Responsibilities',
        items: [
          'Develop and maintain web applications',
          'Build and optimize databases',
          'Write unit tests and documentation',
          'Participate in code reviews'
        ]
      }
    ],
    apply_options: [
      { title: 'Apply Now', link: '#' }
    ]
  }
];

// Counter for generating unique IDs
let idCounter = 0;

export const searchJobs = async (query, location = '') => {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  try {
    const options = {
      method: 'POST',
      url: API_URL,
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'google-jobs-scraper2.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        actor: 'scraper.google.jobs',
        input: {
          engine: 'google_jobs',
          q: location ? `${query} ${location}` : query
        }
      }
    };

    const response = await axios.request(options);
    console.log('Raw API response:', JSON.stringify(response.data, null, 2));
    
    // Check if we have valid job data
    if (response.data && response.data[0]?.jobs_results) {
      console.log('Found jobs:', response.data[0].jobs_results.length);
      return response.data[0].jobs_results.map(job => {
        console.log('Processing job:', job.title);
        idCounter++; // Increment counter for each job
        return {
          id: job.job_id || `job_${idCounter}_${Date.now()}`,
          title: job.title || 'Untitled Position',
          company: job.company_name || 'Company Not Specified',
          location: job.location || 'Location Not Specified',
          description: job.description || 'No description available',
          url: job.apply_options?.[0]?.link || job.share_link || '#',
          date: job.extensions?.find(ext => ext.includes('ago')) || new Date().toISOString(),
          type: job.extensions?.find(ext => 
            ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'].includes(ext)
          ) || 'Full-time',
          salary: job.extensions?.find(ext => 
            ext.includes('$') || ext.includes('K') || ext.includes('k')
          ) || 'Salary not specified',
          requirements: job.job_highlights?.find(h => 
            h.title?.toLowerCase().includes('qualifications') || 
            h.title?.toLowerCase().includes('requirements')
          )?.items || [],
          benefits: job.job_highlights?.find(h => 
            h.title?.toLowerCase().includes('benefits')
          )?.items || [],
          responsibilities: job.job_highlights?.find(h => 
            h.title?.toLowerCase().includes('responsibilities')
          )?.items || [],
          matchedSkills: [], // Will be populated in the frontend
          via: job.via || '',
          thumbnail: job.thumbnail || null,
          source: job.via || job.source || '',
          extensions: job.extensions || [],
          highlights: job.job_highlights || []
        };
      });
    }
    
    // If no jobs found, return mock data for testing
    console.log('No jobs found in response structure, using mock data');
    return mockJobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    // If there's an error, return mock data for testing
    console.log('Using mock data due to API error');
    return mockJobs;
  }
}; 