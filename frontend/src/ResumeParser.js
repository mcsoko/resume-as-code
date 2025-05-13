import React, { useState } from 'react';

function ResumeParser() {
  const [resumeFile, setResumeFile] = useState(null);
  const [skillList, setSkillList] = useState('');
  const [jobKeywords, setJobKeywords] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseResults, setParseResults] = useState(null);
  const [activeTab, setActiveTab] = useState('parser'); // 'parser' or 'analyzer'
  const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'upload'

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSkillListChange = (e) => {
    setSkillList(e.target.value);
  };

  const handleJobKeywordsChange = (e) => {
    setJobKeywords(e.target.value);
  };

  const handleJobDescriptionTextChange = (e) => {
    setJobDescriptionText(e.target.value);
  };

  const handleInputMethodChange = (method) => {
    setInputMethod(method);
  };

  const handleParseResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please select a resume file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('skill_list', skillList);
      formData.append('jd_keywords', jobKeywords);

      const response = await fetch('http://localhost:8000/parse/resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setParseResults(data);
    } catch (error) {
      console.error('Error parsing resume:', error);
      alert(`Error parsing resume: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please select a resume file');
      return;
    }

    // Create temporary file from pasted text if needed
    let jobDescFile = jobDescriptionFile;
    if (inputMethod === 'paste' && jobDescriptionText.trim()) {
      const blob = new Blob([jobDescriptionText], { type: 'text/plain' });
      jobDescFile = new File([blob], 'job_description.txt', { type: 'text/plain' });
    } else if (inputMethod === 'upload' && !jobDescriptionFile) {
      // If upload method selected but no file uploaded, show warning
      if (window.confirm('No job description file selected. Continue without job matching?')) {
        // Continue without job description
      } else {
        return; // Cancel submission
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      if (jobDescFile) {
        formData.append('job_description', jobDescFile);
      }

      const response = await fetch('http://localhost:8000/process/resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setParseResults(data);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert(`Error analyzing resume: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-100 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
            Resume Parser & Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume to extract skills, match job descriptions, and analyze for ATS compatibility
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Resume Upload and Controls */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Resume Analysis</h2>
              <p className="text-blue-100 text-sm">Upload your resume and set parameters</p>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex -mb-px" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('parser')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    activeTab === 'parser' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Skills Parser
                </button>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    activeTab === 'analyzer' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Job Match Analyzer
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'parser' ? (
                <form onSubmit={handleParseResume}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume PDF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setResumeFile)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 focus:outline-none"
                    />
                    {resumeFile && (
                      <p className="mt-1 text-xs text-green-600">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills to Match (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={skillList}
                      onChange={handleSkillListChange}
                      placeholder="python, javascript, react, management, leadership"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={jobKeywords}
                      onChange={handleJobKeywordsChange}
                      placeholder="senior, developer, engineer, experience"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resumeFile}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Parsing...
                      </>
                    ) : 'Parse Resume'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAnalyzeResume}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume PDF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setResumeFile)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 focus:outline-none"
                    />
                    {resumeFile && (
                      <p className="mt-1 text-xs text-green-600">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="flex border-b border-gray-200 -mx-2">
                        <button
                          type="button" 
                          onClick={() => handleInputMethodChange('paste')}
                          className={`px-4 py-2 text-sm font-medium ${
                            inputMethod === 'paste' 
                              ? 'border-b-2 border-blue-500 text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Paste Text
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputMethodChange('upload')}
                          className={`px-4 py-2 text-sm font-medium ${
                            inputMethod === 'upload' 
                              ? 'border-b-2 border-blue-500 text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Upload File
                        </button>
                      </div>
                      
                      <div className="mt-3">
                        {inputMethod === 'paste' ? (
                          <div>
                            <textarea
                              value={jobDescriptionText}
                              onChange={handleJobDescriptionTextChange}
                              placeholder="Paste job description here..."
                              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                              rows={6}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Copy and paste job description text from job boards, company websites, or LinkedIn.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept=".txt,.pdf"
                              onChange={(e) => handleFileChange(e, setJobDescriptionFile)}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 focus:outline-none"
                            />
                            {jobDescriptionFile && (
                              <p className="mt-1 text-xs text-green-600">
                                Selected: {jobDescriptionFile.name}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Upload a .txt or .pdf file containing the job description.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resumeFile}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : 'Analyze Resume'}
                  </button>
                </form>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Tips</h3>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Upload your resume in PDF format for best results</li>
                  <li>Add specific skills you want to check against your resume</li>
                  <li>Job keywords help match your resume against specific requirements</li>
                  <li>You can paste job descriptions directly from job boards or upload as a file</li>
                  <li>For comprehensive analysis, include as much of the original job posting as possible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right panel - Results Display */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Analysis Results</h2>
              <p className="text-gray-300 text-sm">Extracted data and recommendations</p>
            </div>

            <div className="p-6 overflow-auto max-h-[700px]">
              {parseResults ? (
                <div>
                  {/* Resume Basic Info */}
                  {parseResults.name && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Resume Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xl font-bold text-blue-700">{parseResults.name}</p>
                        {parseResults.primary_email && (
                          <p className="text-gray-600">
                            <span className="font-medium">Email:</span> {parseResults.primary_email}
                          </p>
                        )}
                        {parseResults.primary_phone && (
                          <p className="text-gray-600">
                            <span className="font-medium">Phone:</span> {parseResults.primary_phone}
                          </p>
                        )}
                        {parseResults.total_experience && (
                          <p className="text-gray-600">
                            <span className="font-medium">Experience:</span> {parseResults.total_experience} years
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Skills Section */}
                  {parseResults.skills && parseResults.skills.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Skills Detected</h3>
                      <div className="flex flex-wrap gap-2">
                        {parseResults.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Skills */}
                  {parseResults.matching_skills && parseResults.matching_skills.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Skill Matches 
                        {parseResults.skill_match_percentage && (
                          <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {parseResults.skill_match_percentage}% Match
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Matching Skills</h4>
                          <ul className="list-disc list-inside text-sm text-green-700">
                            {parseResults.matching_skills.map((skill, idx) => (
                              <li key={idx}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                        {parseResults.missing_skills && parseResults.missing_skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Skills</h4>
                            <ul className="list-disc list-inside text-sm text-red-700">
                              {parseResults.missing_skills.map((skill, idx) => (
                                <li key={idx}>{skill}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job Keywords Matching */}
                  {parseResults.matching_keywords && parseResults.matching_keywords.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Job Keyword Matches
                        {parseResults.keyword_match_percentage && (
                          <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {parseResults.keyword_match_percentage}% Match
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {parseResults.matching_keywords.map((keyword, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score */}
                  {parseResults.score !== undefined && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Overall Score</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center">
                          <span className="text-4xl font-bold text-blue-700">{parseResults.score}</span>
                          <p className="text-gray-500 text-sm mt-1">Based on skills, experience, and keyword match</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(parseResults.degree || (parseResults.college_name && parseResults.college_name.length > 0)) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Education</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {parseResults.degree && (
                          <p className="text-gray-800 font-medium">{parseResults.degree}</p>
                        )}
                        {parseResults.college_name && parseResults.college_name.map((college, idx) => (
                          <p key={idx} className="text-gray-600">{college}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Companies */}
                  {parseResults.company_names && parseResults.company_names.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Companies</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <ul className="list-disc list-inside text-gray-700">
                          {parseResults.company_names.map((company, idx) => (
                            <li key={idx}>{company}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Designation */}
                  {parseResults.designation && parseResults.designation.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Designation/Titles</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <ul className="list-disc list-inside text-gray-700">
                          {parseResults.designation.map((title, idx) => (
                            <li key={idx}>{title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Experience Details */}
                  {parseResults.experience && parseResults.experience.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Experience Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        {parseResults.experience.map((exp, idx) => (
                          <div key={idx} className="pb-3 border-b border-gray-200 last:border-0">
                            <p className="font-medium text-blue-700">{exp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Extracted Fields */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      All Extracted Fields
                      <button 
                        className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                        onClick={() => {
                          // Create and download JSON file of results
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parseResults, null, 2));
                          const downloadAnchorNode = document.createElement('a');
                          downloadAnchorNode.setAttribute("href", dataStr);
                          downloadAnchorNode.setAttribute("download", "resume_analysis.json");
                          document.body.appendChild(downloadAnchorNode);
                          downloadAnchorNode.click();
                          downloadAnchorNode.remove();
                        }}
                      >
                        Download JSON
                      </button>
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(parseResults)
                          .filter(([key]) => !['extracted_text', 'parsed_with', 'file_path', 'error'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="border-b border-gray-200 pb-2">
                              <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</p>
                              <div className="mt-1">
                                {Array.isArray(value) ? (
                                  value.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm text-gray-600 pl-2">
                                      {value.slice(0, 3).map((item, idx) => (
                                        <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                                      ))}
                                      {value.length > 3 && <li className="list-none text-gray-500">+ {value.length - 3} more items</li>}
                                    </ul>
                                  ) : (
                                    <span className="text-sm text-gray-500">Empty list</span>
                                  )
                                ) : typeof value === 'object' && value !== null ? (
                                  <span className="text-sm text-gray-600">{JSON.stringify(value)}</span>
                                ) : (
                                  <span className="text-sm text-gray-600">{value}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Parsed With Info */}
                  <div className="mt-8 text-sm text-gray-500">
                    Parsed with: {parseResults.parsed_with || "Resume Parser"}
                    {parseResults.file_path && (
                      <span className="ml-2">| File: {parseResults.file_path}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No results yet</p>
                  <p className="mt-1">Upload a resume and click Parse or Analyze</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeParser; 