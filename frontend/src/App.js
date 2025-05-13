import React, { useState, useEffect } from 'react';
import './index.css';
import AceEditor from 'react-ace';
import ResumeParser from './ResumeParser';
import About from './About';

// Import ace modes for syntax highlighting
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';

// Import ace theme
import 'ace-builds/src-noconflict/theme-monokai';

// Import ace editor features
import 'ace-builds/src-noconflict/ext-language_tools';

function App() {
  const [baseFile, setBaseFile] = useState(null);
  const [overlayFile, setOverlayFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [cssFile, setCssFile] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [baseYaml, setBaseYaml] = useState('');
  const [overlayYaml, setOverlayYaml] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  
  // Active file for editing
  const [activeFile, setActiveFile] = useState('base');
  
  // Added navigation state
  const [activeTab, setActiveTab] = useState('generator'); // 'generator', 'parser', or 'about'

  // First, add the state to track the split position
  const [splitPosition, setSplitPosition] = useState(40); // 40% for left panel initially
  const [isDragging, setIsDragging] = useState(false);

  // Add event handlers for the resize functionality
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const containerRect = e.currentTarget.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate percentage (constrain between 20% and 80%)
    let newPosition = (mouseX / containerWidth) * 100;
    newPosition = Math.max(20, Math.min(80, newPosition));
    
    setSplitPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // We also need to add a style to the body when dragging to prevent text selection
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Function to handle file reading for editing
  const readFileContent = (file, setContentFn) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setContentFn(e.target.result);
    };
    reader.readAsText(file);
  };

  // Handle switching to edit mode
  const handleSwitchToEdit = () => {
    // Read files content if available
    if (baseFile) readFileContent(baseFile, setBaseYaml);
    if (overlayFile) readFileContent(overlayFile, setOverlayYaml);
    if (templateFile) readFileContent(templateFile, setTemplateContent);
    if (cssFile) readFileContent(cssFile, setCssContent);
    
    setEditMode(true);
  };

  // Create file objects from editor content
  const createFileFromContent = (content, fileName, type) => {
    if (!content) return null;
    const blob = new Blob([content], { type });
    return new File([blob], fileName, { type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let baseYamlFile = baseFile;
    let overlayYamlFile = overlayFile;
    let templateFileObj = templateFile;
    let cssFileObj = cssFile;
    
    // If in edit mode, create files from editor content
    if (editMode) {
      if (!baseYaml) {
        alert('Base YAML is required.');
        return;
      }
      if (!templateContent) {
        alert('Template is required.');
        return;
      }
      
      baseYamlFile = createFileFromContent(baseYaml, 'base.yaml', 'application/x-yaml');
      if (overlayYaml) {
        overlayYamlFile = createFileFromContent(overlayYaml, 'overlay.yaml', 'application/x-yaml');
      }
      templateFileObj = createFileFromContent(templateContent, 'template.j2', 'text/html');
      if (cssContent) {
        cssFileObj = createFileFromContent(cssContent, 'styles.css', 'text/css');
      }
    } else {
      // Upload mode validation
      if (!baseFile || !templateFile) {
        alert('Base YAML and template are required.');
        return;
      }
    }
    
    const formData = new FormData();
    formData.append('base_yaml', baseYamlFile);
    if (overlayYamlFile) formData.append('overlay_yaml', overlayYamlFile);
    formData.append('template', templateFileObj);
    if (cssFileObj) formData.append('css_file', cssFileObj);

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/generate/html', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err) {
      console.error(err);
      alert(`Failed to generate HTML: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving as PDF
  const handleSaveAsPdf = async () => {
    let baseYamlFile = baseFile;
    let overlayYamlFile = overlayFile;
    let templateFileObj = templateFile;
    let cssFileObj = cssFile;
    
    // If in edit mode, create files from editor content
    if (editMode) {
      if (!baseYaml) {
        alert('Base YAML is required.');
        return;
      }
      if (!templateContent) {
        alert('Template is required.');
        return;
      }
      
      baseYamlFile = createFileFromContent(baseYaml, 'base.yaml', 'application/x-yaml');
      if (overlayYaml) {
        overlayYamlFile = createFileFromContent(overlayYaml, 'overlay.yaml', 'application/x-yaml');
      }
      templateFileObj = createFileFromContent(templateContent, 'template.j2', 'text/html');
      if (cssContent) {
        cssFileObj = createFileFromContent(cssContent, 'styles.css', 'text/css');
      }
    } else {
      // Upload mode validation
      if (!baseFile || !templateFile) {
        alert('Base YAML and template are required for PDF generation.');
        return;
      }
    }

    setPdfLoading(true);
    try {
      // Create a form with the files for direct PDF generation
      const formData = new FormData();
      formData.append('base_yaml', baseYamlFile);
      if (overlayYamlFile) formData.append('overlay_yaml', overlayYamlFile);
      formData.append('template', templateFileObj);
      if (cssFileObj) formData.append('css_file', cssFileObj);
      
      // Use the direct PDF endpoint instead of the HTML-to-PDF conversion
      const response = await fetch('http://localhost:8000/generate/pdf-direct', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Get the PDF file as a blob
      const pdfBlob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(`Failed to generate PDF: ${err.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // Get current editor content based on active file
  const getCurrentContent = () => {
    switch (activeFile) {
      case 'base': return baseYaml;
      case 'overlay': return overlayYaml;
      case 'template': return templateContent;
      case 'css': return cssContent;
      default: return '';
    }
  };

  // Get current editor mode based on active file
  const getCurrentMode = () => {
    switch (activeFile) {
      case 'base': return 'yaml';
      case 'overlay': return 'yaml';
      case 'template': return 'html';
      case 'css': return 'css';
      default: return 'text';
    }
  };

  // Update content based on active file
  const handleEditorChange = (value) => {
    switch (activeFile) {
      case 'base': setBaseYaml(value); break;
      case 'overlay': setOverlayYaml(value); break;
      case 'template': setTemplateContent(value); break;
      case 'css': setCssContent(value); break;
      default: break;
    }
  };

  // Get whether a file is required
  const isFileRequired = (fileType) => {
    return fileType === 'base' || fileType === 'template';
  };

  // Get file name display for the tabs
  const getFileDisplayName = (fileType) => {
    switch (fileType) {
      case 'base': return 'Base YAML';
      case 'overlay': return 'Overlay YAML';
      case 'template': return 'Template (J2)';
      case 'css': return 'CSS';
      default: return '';
    }
  };

  // Function to download a file with specific content
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to handle saving the currently edited file
  const handleSaveEditedFile = () => {
    if (!getCurrentContent()) {
      alert('No content to save');
      return;
    }

    let filename, contentType;
    switch (activeFile) {
      case 'base':
        filename = 'base.yaml';
        contentType = 'application/x-yaml';
        break;
      case 'overlay':
        filename = 'overlay.yaml';
        contentType = 'application/x-yaml';
        break;
      case 'template':
        filename = 'template.j2';
        contentType = 'text/html';
        break;
      case 'css':
        filename = 'styles.css';
        contentType = 'text/css';
        break;
      default:
        return;
    }

    downloadFile(getCurrentContent(), filename, contentType);
  };

  // Function to save all edited files
  const handleSaveAllFiles = () => {
    if (baseYaml) {
      downloadFile(baseYaml, 'base.yaml', 'application/x-yaml');
    }
    if (overlayYaml) {
      downloadFile(overlayYaml, 'overlay.yaml', 'application/x-yaml');
    }
    if (templateContent) {
      downloadFile(templateContent, 'template.j2', 'text/html');
    }
    if (cssContent) {
      downloadFile(cssContent, 'styles.css', 'text/css');
    }
  };

  // Add a function to process HTML for the iframe
  const processHtmlForIframe = (html) => {
    // Check if the HTML starts with a doctype or html tag (indicating a complete document)
    const isCompleteHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(html);
    
    if (isCompleteHtml) {
      // Extract just the body content using regex
      const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
      return bodyMatch ? bodyMatch[1] : html;
    }
    
    return html;
  };

  // Function to download the HTML of the rendered resume
  const handleDownloadHtml = () => {
    if (!previewHtml) {
      alert('No HTML content to download. Please generate a resume first.');
      return;
    }
    
    // Just download the HTML as-is
    downloadFile(previewHtml, 'resume.html', 'text/html');
  };

  // Function to render the generator content
  const renderGeneratorContent = () => {
    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
            Resume Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your files to generate a beautifully formatted resume
          </p>
        </div>
        
        <div className="flex flex-col xl:flex-row w-full gap-6 relative" 
             onMouseMove={isDragging ? handleMouseMove : undefined}
             style={{ cursor: isDragging ? 'col-resize' : 'auto' }}>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-shrink-0 w-full xl:w-auto"
               style={{ 
                 flexBasis: `${splitPosition}%`, 
                 transition: isDragging ? 'none' : 'flex-basis 0.2s',
               }}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Configuration</h2>
              <p className="text-blue-100 text-sm">Upload or edit your resume files</p>
            </div>
            
            {/* Main/Mode Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px" aria-label="Tabs">
                <button
                  onClick={() => setEditMode(false)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    !editMode 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Upload Files
                </button>
                <button
                  onClick={handleSwitchToEdit}
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    editMode 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Edit Files
                </button>
              </nav>
            </div>
            
            {!editMode ? (
              // Upload Files Tab
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Required Files</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base YAML <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".yaml,.yml"
                            onChange={e => setBaseFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 focus:outline-none"
                          />
                          {baseFile && (
                            <p className="mt-1 text-xs text-green-600">
                              Selected: {baseFile.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jinja Template <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".j2,.html"
                            onChange={e => setTemplateFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 focus:outline-none"
                          />
                          {templateFile && (
                            <p className="mt-1 text-xs text-green-600">
                              Selected: {templateFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                  
                      <div className="md:col-span-2 pt-4">
                        <button
                          type="submit"
                          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : 'Generate Resume'}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Optional Files</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Overlay YAML
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".yaml,.yml"
                            onChange={e => setOverlayFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 focus:outline-none"
                          />
                          {overlayFile && (
                            <p className="mt-1 text-xs text-green-600">
                              Selected: {overlayFile.name}
                            </p>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Add an overlay to modify or extend the base YAML
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CSS File
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".css"
                            onChange={e => setCssFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 focus:outline-none"
                          />
                          {cssFile && (
                            <p className="mt-1 text-xs text-green-600">
                              Selected: {cssFile.name}
                            </p>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Add custom styling to your resume
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Tips</h3>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>The base YAML contains your core resume information</li>
                    <li>Use overlay YAML to customize for different job applications</li>
                    <li>Template files (.j2) define the structure of your resume</li>
                    <li>CSS files allow you to style your resume with custom fonts, colors, etc.</li>
                  </ul>
                </div>
              </div>
            ) : (
              // Edit Files Tab
              <div className="p-6">
                {/* File selector tabs */}
                <div className="flex flex-wrap border-b border-gray-200 mb-4">
                  {['base', 'overlay', 'template', 'css'].map(fileType => (
                    <button
                      key={fileType}
                      onClick={() => setActiveFile(fileType)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-md mr-2 focus:outline-none ${
                        activeFile === fileType
                          ? 'bg-gray-100 text-blue-700 border border-gray-200 border-b-0'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {getFileDisplayName(fileType)}
                      {isFileRequired(fileType) && <span className="text-red-500 ml-1">*</span>}
                    </button>
                  ))}
                </div>
                
                {/* File content status */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Editing: {getFileDisplayName(activeFile)}
                    </span>
                    {isFileRequired(activeFile) && (
                      <span className="text-xs text-red-500 ml-1">(Required)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getCurrentContent() ? 
                      <span className="text-green-600">File has content</span> : 
                      <span className={isFileRequired(activeFile) ? "text-red-500" : "text-gray-500"}>
                        {isFileRequired(activeFile) ? "Required - Please add content" : "Optional file"}
                      </span>
                    }
                  </div>
                </div>
                
                {/* Editor */}
                <form onSubmit={handleSubmit}>
                  <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
                    <AceEditor
                      mode={getCurrentMode()}
                      theme="monokai"
                      name={`${activeFile}-editor`}
                      value={getCurrentContent()}
                      onChange={handleEditorChange}
                      fontSize={14}
                      width="100%"
                      height="500px"
                      showPrintMargin={false}
                      showGutter={true}
                      highlightActiveLine={true}
                      editorProps={{ $blockScrolling: Infinity }}
                      setOptions={{
                        useWorker: false,
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: false,
                        showLineNumbers: true,
                        tabSize: 2,
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleSaveEditedFile}
                        className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Save Current File
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllFiles}
                        className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Save All Files
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : 'Generate Resume'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          {/* Resize handle */}
          <div className="hidden xl:block absolute top-0 bottom-0 w-6 cursor-col-resize z-10"
               style={{ left: `calc(${splitPosition}% - 3px)` }}
               onMouseDown={handleMouseDown}>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-gray-300 hover:bg-blue-500 hover:w-1.5 hover:-ml-0.75 transition-all" />
          </div>
          
          {/* Preview card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-grow">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Resume Preview</h2>
              <p className="text-gray-300 text-sm">Generated HTML with applied styling</p>
            </div>
            
            {/* Preview content */}
            <div className="p-6">
              {previewHtml ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                    <div className="flex space-x-2">
                      {/* HTML Download Button */}
                      <button
                        onClick={handleDownloadHtml}
                        disabled={!previewHtml}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Download HTML
                      </button>
                      
                      {/* PDF Download Button */}
                      <button
                        onClick={handleSaveAsPdf}
                        disabled={pdfLoading || !previewHtml}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {pdfLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* HTML Preview */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white w-full" style={{ height: '800px' }}>
                    <iframe
                      title="Resume Preview"
                      srcDoc={previewHtml}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        overflow: 'auto',
                        display: 'block'
                      }}
                      sandbox="allow-same-origin"
                    />
                  </div>

                  {/* Debug panel - enable for troubleshooting */}
                  {true && previewHtml && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium mb-2">HTML Source (for debugging):</h4>
                      <pre className="text-xs overflow-auto max-h-[200px] bg-white p-2 rounded border">
                        {previewHtml.substring(0, 2000)}...
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No preview available</p>
                  <p className="mt-1">Complete the form and click Generate Resume</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Resume-as-Code Generator • © {new Date().getFullYear()}</p>
        </div>
      </>
    );
  };

  // Function to render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'parser':
        return <ResumeParser />;
      case 'about':
        return <About />;
      case 'generator':
      default:
        return renderGeneratorContent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-100 py-12 px-4 sm:px-6">
      <div className="max-w-full xl:max-w-[1500px] mx-auto">
        {/* Main navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-md">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-3 font-medium text-sm flex-grow text-center focus:outline-none transition-colors ${
                activeTab === 'generator' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              Resume Generator
            </button>
            <button
              onClick={() => setActiveTab('parser')}
              className={`px-4 py-3 font-medium text-sm flex-grow text-center focus:outline-none transition-colors ${
                activeTab === 'parser' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              Resume Parser & Analyzer
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-3 font-medium text-sm flex-grow text-center focus:outline-none transition-colors ${
                activeTab === 'about' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              About
            </button>
          </nav>
        </div>
        
        {/* Render the active content */}
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
