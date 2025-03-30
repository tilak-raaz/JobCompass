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

export const searchJobs = async (query, location = '') => {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  // Return mock data instead of making API call
  console.log('Using mock data for testing');
  
  try {
    // Filter mock jobs based on query and location
    const filteredJobs = mockJobs.filter(job => {
      const searchText = `${job.title} ${job.company_name} ${job.location} ${job.description}`.toLowerCase();
      const searchQuery = (query + ' ' + location).toLowerCase();
      return searchText.includes(searchQuery);
    });

    // Format the response to match our application's structure
    return filteredJobs.map(job => {
      // Extract job highlights
      const qualifications = [];
      const benefits = [];
      const responsibilities = [];

      if (job.job_highlights) {
        job.job_highlights.forEach(highlight => {
          if (!highlight || !highlight.items) return;
          
          const title = highlight.title?.toLowerCase() || '';
          if (title.includes('qualifications') || title.includes('requirements')) {
            qualifications.push(...highlight.items);
          } else if (title.includes('benefits')) {
            benefits.push(...highlight.items);
          } else if (title.includes('responsibilities')) {
            responsibilities.push(...highlight.items);
          }
        });
      }

      // Extract job type and salary from extensions
      const extensions = job.extensions || [];
      const jobType = extensions.find(ext => 
        ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'].includes(ext)
      ) || 'Full-time';
      
      const salary = extensions.find(ext => 
        ext.includes('$') || ext.includes('K') || ext.includes('k')
      ) || 'Salary not specified';

      // Ensure all required fields have fallback values
      const formattedJob = {
        id: job.job_id || `job_${Math.random().toString(36).substr(2, 9)}`,
        title: job.title || 'Untitled Position',
        company: job.company_name || 'Company Not Specified',
        location: job.location || 'Location Not Specified',
        description: job.description || 'No description available',
        url: job.apply_options?.[0]?.link || job.share_link || '#',
        date: extensions.find(ext => ext.includes('ago')) || new Date().toISOString(),
        type: jobType,
        salary: salary,
        requirements: qualifications,
        benefits: benefits,
        responsibilities: responsibilities,
        matchedSkills: [], // Will be populated in the frontend
        via: job.via || '',
        thumbnail: job.thumbnail || null,
        source: job.via || job.source || '',
        extensions: extensions,
        highlights: job.job_highlights || []
      };

      // Clean up any HTML tags in the description
      formattedJob.description = formattedJob.description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Clean up any HTML tags in requirements, benefits, and responsibilities
      formattedJob.requirements = formattedJob.requirements.map(req => 
        req.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      );
      formattedJob.benefits = formattedJob.benefits.map(benefit => 
        benefit.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      );
      formattedJob.responsibilities = formattedJob.responsibilities.map(resp => 
        resp.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      );

      return formattedJob;
    });
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    
    throw new Error('Failed to fetch jobs');
  }
}; 