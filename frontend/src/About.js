import React, { useEffect, useState, useRef } from 'react';
import './infographic.css';

function About() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [animatingSlide, setAnimatingSlide] = useState(false);
  const [direction, setDirection] = useState('next');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const slidesRef = useRef([]);
  const totalSlides = 6; // Total number of slides
  
  useEffect(() => {
    // Reset scroll position
    window.scrollTo(0, 0);
    
    // Initialize the first slide as visible
    if (slidesRef.current.length > 0 && slidesRef.current[0]) {
      slidesRef.current[0].classList.add('active');
    }
    
    // Handle viewport height changes (e.g., mobile orientation change)
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const addToRefs = (el) => {
    if (el && !slidesRef.current.includes(el)) {
      slidesRef.current.push(el);
    }
  };
  
  const goToSlide = (index) => {
    if (animatingSlide) return; // Prevent navigation during animation
    
    if (index < 0 || index >= totalSlides) return; // Stay within bounds
    
    setAnimatingSlide(true);
    setDirection(index > activeSlide ? 'next' : 'prev');
    
    // Remove active class from current slide
    slidesRef.current[activeSlide].classList.remove('active');
    slidesRef.current[activeSlide].classList.add(index > activeSlide ? 'slide-out-left' : 'slide-out-right');
    
    // Add active class to new slide
    setTimeout(() => {
      slidesRef.current[activeSlide].classList.remove('slide-out-left', 'slide-out-right');
      slidesRef.current[index].classList.add('active');
      slidesRef.current[index].classList.add(index > activeSlide ? 'slide-in-right' : 'slide-in-left');
      
      setActiveSlide(index);
      
      // Remove transition classes after animation completes
      setTimeout(() => {
        slidesRef.current[index].classList.remove('slide-in-right', 'slide-in-left');
        setAnimatingSlide(false);
      }, 500);
    }, 500);
  };
  
  const nextSlide = () => {
    goToSlide(activeSlide + 1);
  };
  
  const prevSlide = () => {
    goToSlide(activeSlide - 1);
  };

  // Set dynamic style based on viewport height to ensure content fits
  const containerStyle = {
    minHeight: `${viewportHeight}px`,
    maxHeight: `${viewportHeight}px`
  };
  
  // Check if viewport is small to show condensed content
  const isSmallViewport = viewportHeight < 700;
  
  return (
    <div className="presentation-container" style={containerStyle}>
      {/* Slide Navigation Controls */}
      <div className="slide-controls">
        <button 
          className={`nav-button prev ${activeSlide === 0 ? 'disabled' : ''}`} 
          onClick={prevSlide}
          disabled={activeSlide === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path fill="currentColor" d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/>
          </svg>
        </button>
        
        {/* Slide Indicators */}
        <div className="slide-indicators">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button 
              key={index}
              className={`slide-indicator ${activeSlide === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          className={`nav-button next ${activeSlide === totalSlides - 1 ? 'disabled' : ''}`} 
          onClick={nextSlide}
          disabled={activeSlide === totalSlides - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path fill="currentColor" d="M400-240 360-280l184-184-184-184 40-40 224 224-224 224Z"/>
          </svg>
        </button>
      </div>
      
      <div className="slides-container">
        {/* Slide 1: Hero Section - Simplified for better fit */}
        <div ref={addToRefs} className="slide hero-slide">
          <div className="slide-content">
            <h1 className="infographic-title">The Resume Revolution</h1>
            {!isSmallViewport && (
              <p className="infographic-subtitle">
                In today's competitive job market, your resume is more than a document—it's your digital first impression
              </p>
            )}
            <div className="stat-highlight">
              <div className="stat-number">75%</div>
              <div className="stat-description">of resumes are rejected by ATS before a human sees them</div>
              <div className="stat-source">Source: Resume Go, 2023</div>
            </div>
            <div className="slide-nav-hint">
              <span>Navigate using arrows</span>
              <svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                <path fill="currentColor" d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Slide 2: The ATS Challenge */}
        <div ref={addToRefs} className="slide ats-challenge-slide">
          <div className="slide-content">
            <h2 className="section-title">The ATS Challenge</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-360Zm-60 220 56-56 56 56 40-40-56-56 56-56-40-40-56 56-56-56-40 40 56 56-56 56 40 40ZM304-444h352v-72H304v72Z"/>
                  </svg>
                </div>
                <div className="stat-number">98%</div>
                <div className="stat-description">of Fortune 500 companies use ATS software</div>
                <div className="stat-source">Source: Jobscan, 2022</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M360-240h240v-80H360v80Zm0-160h240v-80H360v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
                  </svg>
                </div>
                <div className="stat-number">70%</div>
                <div className="stat-description">of resumes are never seen due to formatting issues</div>
                <div className="stat-source">Source: Harvard Business Review, 2022</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M160-200v-240h160v240H160Zm240 0v-240h160v240H400Zm240 0v-240h160v240H640ZM160-480v-160h160v160H160Zm240 0v-160h160v160H400Zm240 0v-160h160v160H640Z"/>
                  </svg>
                </div>
                <div className="stat-number">60%</div>
                <div className="stat-description">of qualified candidates are eliminated due to keyword mismatches</div>
                <div className="stat-source">Source: Zippia, 2023</div>
              </div>
            </div>
            <div className="info-block">
              <p>
                Applicant Tracking Systems (ATS) are designed to filter resumes that don't meet specific criteria, 
                but they often reject qualified candidates because of formatting issues or missing keywords.
              </p>
            </div>
          </div>
        </div>
        
        {/* Slide 3: Customization Advantage */}
        <div ref={addToRefs} className="slide customization-slide">
          <div className="slide-content">
            <h2 className="section-title">The Customization Advantage</h2>
            <div className="impact-chart">
              <div className="chart-bar-container">
                <div className="chart-label">Generic Resume</div>
                <div className="chart-bar" style={{width: '30%', '--width': '30%'}}>
                  <span className="bar-value">30%</span>
                </div>
              </div>
              <div className="chart-bar-container">
                <div className="chart-label">Keyword Optimized</div>
                <div className="chart-bar" style={{width: '60%', '--width': '60%'}}>
                  <span className="bar-value">60%</span>
                </div>
              </div>
              <div className="chart-bar-container">
                <div className="chart-label">Fully Customized</div>
                <div className="chart-bar" style={{width: '85%', '--width': '85%'}}>
                  <span className="bar-value">85%</span>
                </div>
              </div>
              <div className="chart-title">Interview Callback Rate</div>
              <div className="chart-source">Source: ResumeGenius, 2023</div>
            </div>
            <div className="stats-row">
              <div className="stat-bubble">
                <div className="stat-number">63%</div>
                <div className="stat-description">of recruiters favor tailored resumes</div>
              </div>
              <div className="stat-bubble">
                <div className="stat-number">6x</div>
                <div className="stat-description">more likely to get an interview with a tailored resume</div>
              </div>
              <div className="stat-bubble">
                <div className="stat-number">40%</div>
                <div className="stat-description">higher salary offers with optimized applications</div>
              </div>
            </div>
            <div className="stat-source center">Sources: Zety, 2023; TopResume, 2022; LinkedIn, 2023</div>
          </div>
        </div>
        
        {/* Slide 4: Time Challenge */}
        <div ref={addToRefs} className="slide time-challenge-slide">
          <div className="slide-content">
            <h2 className="section-title">The Time Challenge</h2>
            <div className="time-visualization">
              <div className="time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" height="64" viewBox="0 -960 960 960" width="64">
                  <path fill="currentColor" d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q74 0 139.5 28.5T734-694q49 49 77.5 114.5T840-440q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z"/>
                </svg>
              </div>
              <div className="time-stats">
                <div className="time-stat">
                  <div className="time-hours">7.4</div>
                  <div className="time-label">Hours average job seekers spend per application</div>
                </div>
                <div className="time-stat">
                  <div className="time-hours">2-3</div>
                  <div className="time-label">Hours specifically on resume customization</div>
                </div>
                <div className="time-stat">
                  <div className="time-hours">21+</div>
                  <div className="time-label">Applications needed for one interview</div>
                </div>
              </div>
              <div className="stat-source">Source: TalentWorks Research, 2022</div>
            </div>
            <div className="info-block highlight">
              <p>
                <span className="emphasize">Time spent on applications:</span> 21 applications × 7.4 hours = <span className="highlight-number">155+ hours</span> of work 
                for a single interview opportunity
              </p>
            </div>
          </div>
        </div>
        
        {/* Slide 5: Resume Dos and Don'ts */}
        <div ref={addToRefs} className="slide dos-donts-slide">
          <div className="slide-content">
            <h2 className="section-title">Resume Dos and Don'ts</h2>
            <div className="dos-donts-container">
              <div className="dos-column">
                <div className="dos-title">
                  <svg xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 -960 960 960" width="36">
                    <path fill="currentColor" d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                  </svg>
                  <h3>DO</h3>
                </div>
                <ul className="dos-list">
                  <li>
                    <div className="item-number">1</div>
                    <div className="item-content">
                      <h4>Tailor your resume for each application</h4>
                      <p>Customize your resume to match the specific job description and company requirements.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">2</div>
                    <div className="item-content">
                      <h4>Use keywords from the job description</h4>
                      <p>Include relevant industry terms and skills that match those mentioned in the posting.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">3</div>
                    <div className="item-content">
                      <h4>Quantify your achievements</h4>
                      <p>Use metrics and numbers to demonstrate the impact of your work (e.g., "increased sales by 25%").</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">4</div>
                    <div className="item-content">
                      <h4>Use a clean, ATS-friendly format</h4>
                      <p>Stick with standard fonts, clear headings, and simple formatting that can be parsed by software.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">5</div>
                    <div className="item-content">
                      <h4>Proofread thoroughly</h4>
                      <p>Eliminate spelling and grammar errors—they're the easiest way to get rejected.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="donts-column">
                <div className="donts-title">
                  <svg xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 -960 960 960" width="36">
                    <path fill="currentColor" d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                  </svg>
                  <h3>DON'T</h3>
                </div>
                <ul className="donts-list">
                  <li>
                    <div className="item-number">1</div>
                    <div className="item-content">
                      <h4>Use generic, one-size-fits-all resumes</h4>
                      <p>Generic resumes show a lack of interest and rarely address the specific needs of the employer.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">2</div>
                    <div className="item-content">
                      <h4>Include irrelevant experience</h4>
                      <p>Focus on relevant skills and experience—avoid adding unrelated positions just to fill space.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">3</div>
                    <div className="item-content">
                      <h4>Use complex graphics or designs</h4>
                      <p>Fancy designs often confuse ATS systems and can cause your resume to be rejected automatically.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">4</div>
                    <div className="item-content">
                      <h4>Include personal information</h4>
                      <p>Avoid photos, marital status, age, or other personal details that could lead to unconscious bias.</p>
                    </div>
                  </li>
                  <li>
                    <div className="item-number">5</div>
                    <div className="item-content">
                      <h4>Exceed two pages</h4>
                      <p>Most resumes should be 1-2 pages maximum—recruiters typically spend less than 10 seconds scanning them.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Slide 6: Solution */}
        <div ref={addToRefs} className="slide solution-slide">
          <div className="slide-content">
            <h2 className="section-title">The Resume-as-Code Solution</h2>
            <div className="solution-benefits">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Easy Customization</h3>
                <p className="benefit-description">
                  Create multiple versions of your resume from a single data source
                </p>
                <div className="benefit-stat">
                  <div className="stat-value">85%</div>
                  <div className="stat-label">reduction in customization time</div>
                </div>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29.5T120-322v-316q0-22 10.5-41t29.5-30l280-161q19-11 40-11t40 11l280 161q19 11 29.5 30t10.5 41v316q0 22-10.5 40.5T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Version Control</h3>
                <p className="benefit-description">
                  Track changes over time and maintain multiple versions with Git-like tracking
                </p>
                <div className="benefit-stat">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">change history preserved</div>
                </div>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">ATS Optimization</h3>
                <p className="benefit-description">
                  Automatically ensure your resume passes ATS checks with proper formatting
                </p>
                <div className="benefit-stat">
                  <div className="stat-value">93%</div>
                  <div className="stat-label">ATS compatibility rate</div>
                </div>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
                    <path fill="currentColor" d="M290-738q21-29 50-45.5t70-16.5q41 0 70 16.5t50 45.5h207q24.75 0 42.38 17.63T797-678v503q0 24.75-17.62 42.38T737-115H223q-24.75 0-42.38-17.62T163-175v-503q0-24.75 17.63-42.37T223-738h67Zm-67 63v503h514v-503H529l-39 65-39-65H223Zm107 254h300v-60H330v60Zm0 110h300v-60H330v60Zm167-364q17 0 28.5-11.5T537-715q0-17-11.5-28.5T497-755q-17 0-28.5 11.5T457-715q0 17 11.5 28.5T497-675ZM223-175v-503 503Z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Job Matching</h3>
                <p className="benefit-description">
                  Compare your resume against job descriptions for targeted optimization
                </p>
                <div className="benefit-stat">
                  <div className="stat-value">72%</div>
                  <div className="stat-label">higher match rate</div>
                </div>
              </div>
            </div>
            <div className="info-block final-cta">
              <h3>Transform Your Job Search</h3>
              <p>
                Resume-as-Code isn't just a tool—it's a new approach to job applications that gives you 
                control, saves you time, and dramatically increases your chances of getting interviews.
              </p>
              <div className="cta-buttons">
                <button className="cta-button primary">Get Started</button>
                <button className="cta-button secondary">Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Section - Always visible but more compact */}
      <footer className="presentation-footer">
        <p>Statistics from ResumeGo, Jobscan, Harvard Business Review, Zippia, ResumeGenius, Zety, TopResume, LinkedIn, and TalentWorks · © {new Date().getFullYear()} Resume-as-Code</p>
      </footer>
    </div>
  );
}

export default About; 