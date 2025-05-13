import React, { useEffect, useState } from 'react';
import './pipeline-animation.css';

// Animation speed control - increase this value to slow down all animations
// Base unit is in milliseconds
const ANIMATION_BASE_SPEED = 3000; // Adjust this value to control overall animation speed

function About() {
  const [activeStage, setActiveStage] = useState(0);
  
  const stageDescriptions = [
    "Start by defining your resume template - the structure that will hold your professional story.",
    "Create structured YAML data containing your skills, experience, and education.",
    "Generate a professional resume by combining your data with the selected template.",
    "Verify your resume passes ATS (Applicant Tracking Systems) filters used by employers.",
    "Compare your resume against job descriptions to identify keyword matches.",
    "Create personalized versions of your resume optimized for specific job applications."
  ];

  useEffect(() => {
    const pipeline = document.querySelector('.pipeline-animation');
    if (pipeline) {
      // Derive all timing values from the base speed
      const startDelay = ANIMATION_BASE_SPEED / 3;
      
      // Set animation timing via CSS variables
      document.documentElement.style.setProperty('--animation-speed', `${ANIMATION_BASE_SPEED}ms`);
      document.documentElement.style.setProperty('--connector-duration', `${ANIMATION_BASE_SPEED * 0.8}ms`);
      
      setTimeout(() => {
        pipeline.classList.add('animate');
        
        // Set initial description
        setActiveStage(0);
        
        // Calculate all stage transitions based on the base speed
        setTimeout(() => setActiveStage(0), startDelay);
        setTimeout(() => setActiveStage(1), ANIMATION_BASE_SPEED * 1.5);
        setTimeout(() => setActiveStage(2), ANIMATION_BASE_SPEED * 2.5);
        setTimeout(() => setActiveStage(3), ANIMATION_BASE_SPEED * 3.5);
        setTimeout(() => setActiveStage(4), ANIMATION_BASE_SPEED * 4.5);
        setTimeout(() => setActiveStage(5), ANIMATION_BASE_SPEED * 5.5);
      }, startDelay);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
            About Resume-as-Code
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate professional resumes with code-like versioning and customization
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-blue-600 py-4 px-6">
            <h2 className="text-xl font-bold text-white">The Resume-as-Code Pipeline</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6 text-center">
              Our end-to-end process transforms your data into job-optimized resumes
            </p>
            
            <div className="pipeline-container isometric-container">
              <div className="pipeline-animation isometric-pipeline">
                {/* Fixed positioning references */}
                <div className="iso-reference-line"></div>
                
                {/* 3D Isometric Pipeline with Stages */}
                <div className="isometric-grid">
                  {/* Stage 1: Template */}
                  <div className={`iso-stage stage-1 ${activeStage >= 0 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-right"></div>
                      <div className="iso-node">
                        <span className="text-blue-500 font-bold">1</span>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="iso-label">Define Template</div>
                    </div>
                  </div>
                  
                  {/* Stage 2: YAML */}
                  <div className={`iso-stage stage-2 ${activeStage >= 1 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-left"></div>
                      <div className="iso-connector connector-right"></div>
                      <div className="iso-node">
                        <span className="text-blue-500 font-bold">2</span>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6M9 15h6" />
                        </svg>
                      </div>
                      <div className="iso-label">Create YAML</div>
                    </div>
                  </div>
                  
                  {/* Stage 3: Render */}
                  <div className={`iso-stage stage-3 ${activeStage >= 2 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-left"></div>
                      <div className="iso-connector connector-right"></div>
                      <div className="iso-node">
                        <span className="text-blue-500 font-bold">3</span>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="iso-label">Render Resume</div>
                    </div>
                  </div>
                  
                  {/* Stage 4: ATS Test */}
                  <div className={`iso-stage stage-4 ${activeStage >= 3 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-left"></div>
                      <div className="iso-connector connector-right"></div>
                      <div className="iso-node">
                        <span className="text-blue-500 font-bold">4</span>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="iso-label">ATS Testing</div>
                    </div>
                  </div>
                  
                  {/* Stage 5: Compare */}
                  <div className={`iso-stage stage-5 ${activeStage >= 4 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-left"></div>
                      <div className="iso-connector connector-right"></div>
                      <div className="iso-node">
                        <span className="text-blue-500 font-bold">5</span>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="iso-label">Job Matching</div>
                    </div>
                  </div>
                  
                  {/* Stage 6: Final Resume */}
                  <div className={`iso-stage stage-6 ${activeStage >= 5 ? 'active' : ''}`}>
                    <div className="iso-platform">
                      <div className="iso-connector connector-left"></div>
                      <div className="iso-node">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="iso-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="iso-label">Personalized Resume</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 bg-green-50 rounded-lg p-5 text-center result-message">
                <p className="text-green-800 font-medium">
                  {activeStage < stageDescriptions.length 
                    ? stageDescriptions[activeStage]
                    : "The result: A tailored resume optimized for each job application with increased confidence in getting past ATS filters."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
            <h2 className="text-xl font-bold text-white">What is Resume-as-Code?</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Resume-as-Code is a modern approach to resume creation and management that treats your resume like a software project. It separates your content (data) from presentation (styling) using a structured YAML format and customizable templates.
            </p>
            <p className="text-gray-700 mb-4">
              By storing your resume as code, you gain several benefits:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Version control your resume with Git</li>
              <li>Create targeted versions for different job applications</li>
              <li>Separate content from styling</li>
              <li>Generate both HTML and PDF formats</li>
              <li>Analyze your resume against job descriptions</li>
              <li>Ensure your resume is optimized for ATS (Applicant Tracking Systems)</li>
            </ul>
            <p className="text-gray-700">
              The application provides a user-friendly interface for non-technical users while preserving all the benefits of a code-based approach.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
            <h2 className="text-xl font-bold text-white">How It Works</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">1. Define Your Data</h3>
                <p className="text-gray-600 text-sm">
                  Store your resume content in a structured YAML format with sections for experience, education, skills, and more.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2. Choose a Template</h3>
                <p className="text-gray-600 text-sm">
                  Select from various templates or create your own using Jinja2 templating language to control the layout.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">3. Generate & Export</h3>
                <p className="text-gray-600 text-sm">
                  Generate HTML previews and export to PDF with professional formatting for job applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
            <h2 className="text-xl font-bold text-white">Key Features</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Resume Generator</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create professionally formatted resumes from structured YAML data with customizable templates.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Resume Parser</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Analyze existing resumes to extract skills, experience, and other key information.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Job Matching</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Compare your resume against job descriptions to identify matching skills and experience.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">ATS Optimization</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ensure your resume is optimized for Applicant Tracking Systems with proper formatting and keywords.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
            <h2 className="text-xl font-bold text-white">Get Started</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Ready to create your resume-as-code? Use our Resume Generator to get started, or check out the documentation for more advanced usage.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <button 
                onClick={() => window.location.href = 'https://github.com/username/resume-as-code'} 
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                GitHub Repository
              </button>
              <button 
                onClick={() => window.location.href = 'https://github.com/username/resume-as-code/blob/main/README.md'} 
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Resume-as-Code • © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default About; 