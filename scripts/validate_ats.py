#!/usr/bin/env python3
import os
import sys
import re
import json
from collections import Counter
import platform

# Check Python version first
python_version = tuple(map(int, platform.python_version_tuple()))
if python_version[0] == 3 and python_version[1] >= 13:
    print(f"\nWarning: You are using Python {platform.python_version()}, but this script requires Python 3.9-3.10 for best compatibility.")
    print("Please use a compatible Python version with: python3.9 scripts/validate_ats.py <resume.pdf> <job_description.txt>")
    print("Or create a virtual environment with Python 3.9 and install the required packages.")
    sys.exit(1)

try:
    import nltk
    import spacy
    from pdfminer.high_level import extract_text
    from resume_parser import extract_text_from_pdf, extract_name, extract_contact_info, extract_position, extract_education, extract_experience, extract_skills
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    print(f"\nError: Missing required package: {e.name}")
    print("Please install the required packages using:")
    print("  pip install resume-parser nltk spacy scikit-learn pdfminer.six")
    print("  python -m spacy download en_core_web_md")
    print("  python -m nltk.downloader punkt stopwords")
    sys.exit(1)

# Download necessary NLTK data if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

# Initialize spaCy model
try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_md"], check=True)
    nlp = spacy.load("en_core_web_md")


def analyze_resume_ats_compatibility(path):
    """
    Analyze resume for ATS compatibility issues.
    Returns a list of potential issues found.
    """
    # Extract raw text for inspection
    raw_text = extract_text(path)
    
    issues = []
    
    # Check for formatting issues that can confuse ATS systems
    if re.search(r'\s{4,}', raw_text):
        issues.append("Multiple consecutive spaces detected - could indicate tables or columns")
    
    if re.search(r'\t', raw_text):
        issues.append("Tab characters detected - can cause formatting issues in ATS")
    
    # Check for specific characters/formatting that cause problems
    if re.search(r'[^\x00-\x7F]', raw_text):
        issues.append("Non-ASCII characters detected - may not parse correctly in some ATS systems")
    
    if re.search(r'•', raw_text):
        issues.append("Bullet points detected - while common, some systems may not handle them correctly")
    
    # Check for headers/footers that might be parsed incorrectly
    lines = raw_text.splitlines()
    if len(lines) >= 10:
        header_footer_check = lines[:5] + lines[-5:]
        for line in header_footer_check:
            if re.search(r'page|^\d+$', line.lower()):
                issues.append("Possible page numbers or headers/footers detected")
                break
    
    # Check for other common issues
    if re.search(r'^\s*[A-Z][A-Z\s]+$', raw_text, re.MULTILINE):
        issues.append("All-caps text detected - while acceptable for headings, excessive use can trigger spam filters")
    
    # Check for file size (large PDFs might be problematic)
    file_size = os.path.getsize(path) / (1024 * 1024)  # Convert to MB
    if file_size > 5:
        issues.append(f"Resume file size is {file_size:.1f}MB - files over 5MB may be rejected by some systems")
    
    return issues


def extract_resume_data(path):
    """
    Extract data from resume using resume_parser.
    Returns structured resume data.
    """
    # Extract text from PDF
    text = extract_text_from_pdf(path)
    
    # Also get the raw text directly to ensure we don't miss anything
    raw_text = extract_text(path)
    
    # Parse different components
    name_tuple = extract_name(text)
    name = name_tuple[0] if isinstance(name_tuple, tuple) and len(name_tuple) > 0 else ""
    
    contact_info = extract_contact_info(text)
    email = contact_info.get('email', [''])[0] if contact_info.get('email') else ""
    phone = contact_info.get('phone', [''])[0] if contact_info.get('phone') else ""
    
    position = extract_position(text)
    education_list = extract_education(text)
    experience_list = extract_experience(text)
    skills_list = extract_skills(text)
    
    # Clean up experience entries for display
    cleaned_experience = []
    for exp in experience_list:
        if isinstance(exp, dict):
            job_title = exp.get('job_title', '')
            company = exp.get('company', '')
            dates = exp.get('dates', '')
            description = exp.get('description', '')
            
            entry = f"{job_title} at {company}, {dates}\n{description}"
            cleaned_experience.append(entry)
        else:
            cleaned_experience.append(str(exp))
    
    # Add additional skills extraction from raw text to catch more relevant skills
    additional_skills = extract_additional_skills(raw_text)
    all_skills = list(set(skills_list + additional_skills))
    
    # Clean up skills entries - remove any non-skill entries
    cleaned_skills = []
    for skill in all_skills:
        # Skip very long entries (likely not skills)
        if len(skill.split()) > 5:
            continue
        # Skip entries with special characters or punctuation (except hyphens)
        if re.search(r'[^\w\s\-]', skill):
            continue
        # Clean up and normalize skill text
        skill = skill.lower().strip()
        if skill and len(skill) > 1:  # Skip single-character skills
            cleaned_skills.append(skill)
    
    # Combine everything into a structured data object
    resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "position": position if position != "Not Found" else "",
        "education": education_list,
        "experience": cleaned_experience,
        "skills": cleaned_skills,
        "text": raw_text  # Include full text for additional processing
    }
    
    return resume_data


def extract_additional_skills(text):
    """
    Extract additional skills from raw text that might be missed by the resume parser.
    Uses a comprehensive list of technical skills and regular expressions to find matches.
    """
    # Common tech skills to look for
    tech_skills = [
        # Languages
        "python", "java", "javascript", "typescript", "c++", "c#", "php", "ruby", "go", "rust", "scala",
        # Web/Frontend
        "html", "css", "react", "angular", "vue", "jquery", "bootstrap", "tailwind",
        # Backend/Frameworks
        "node.js", "express", "django", "flask", "spring", "rails", "laravel", "asp.net",
        # Databases
        "sql", "mysql", "postgresql", "mongodb", "oracle", "nosql", "redis", "sqlite",
        # Cloud/Infrastructure
        "aws", "azure", "gcp", "docker", "kubernetes", "openshift", "terraform", "cloudformation", "pulumi",
        # DevOps/Tools
        "git", "ci/cd", "jenkins", "github actions", "gitlab ci", "circleci", "ansible", "chef", "puppet",
        # Monitoring/Logging
        "prometheus", "grafana", "elk", "splunk", "datadog", "newrelic",
        # Security
        "oauth", "jwt", "rbac", "iam", "encryption", "vault", "secrets management", "zero trust",
        # Concepts
        "agile", "scrum", "kanban", "microservices", "serverless", "rest", "graphql", "grpc", "gitops", "argocd", "helm"
    ]
    
    found_skills = []
    text_lower = text.lower()
    
    # Look for exact matches
    for skill in tech_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill)
    
    # Also look for specific skill patterns in the text
    skill_patterns = [
        # Tools and platforms with version numbers
        r'\b(kubernetes|docker|terraform|ansible|jenkins|aws|azure|gcp)\s+\d+[\.\d+]*\b',
        # Skill with expertise level
        r'\b(advanced|expert|proficient|intermediate)\s+(\w+)\b',
        # Certificate abbreviations
        r'\b(aws|azure|gcp|cka|ckad|terraform|hashicorp)[- ]?(certified|associate|professional|architect)\b',
    ]
    
    for pattern in skill_patterns:
        matches = re.finditer(pattern, text_lower)
        for match in matches:
            found_skills.append(match.group().strip())
    
    # Extract known DevOps/Cloud skills from the text using the document structure
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "ORG" and any(tech in ent.text.lower() for tech in ["aws", "amazon", "microsoft", "azure", "google", "cloud", "hashicorp", "docker", "kubernetes"]):
            found_skills.append(ent.text.lower())
    
    # Extract skill phrases from resume sections that are likely to contain skills
    skill_section_pattern = r'(?:skills|expertise|technologies|technical|proficiencies|qualifications)(?::|$)(.*?)(?:\n\s*\n|$)'
    skill_sections = re.findall(skill_section_pattern, text_lower, re.DOTALL)
    
    for section in skill_sections:
        # Extract bullet points or comma-separated lists
        skill_items = re.findall(r'(?:^|\n)(?:•|-|\*|★|✓)\s*([^•\n]+)', section)
        for item in skill_items:
            parts = [p.strip() for p in item.split(',')]
            found_skills.extend(parts)
    
    return list(set(found_skills))


def extract_job_description_skills(text):
    """
    Extract skills and requirements from a job description.
    Returns a list of extracted skills/keywords.
    """
    # Process with spaCy
    doc = nlp(text)
    
    # Extract technical skills and tools
    tech_patterns = [
        r'\b(?:java|python|c\+\+|javascript|html|css|sql|react|node|php|ruby|go|swift|kotlin)\b',
        r'\b(?:aws|azure|gcp|docker|kubernetes|jenkins|git|terraform|ansible)\b',
        r'\b(?:agile|scrum|kanban|waterfall|devops|ci/cd|tdd|bdd)\b',
        r'\b(?:sql|mysql|postgresql|mongodb|oracle|nosql|redis)\b'
    ]
    
    # Extract bullet points (they often contain requirements)
    bullet_points = re.findall(r'(?:^|\n)(?:•|-|\*)\s*(.+?)(?:\n|$)', text)
    
    skills = set()
    
    # Extract from bullet points first
    for point in bullet_points:
        # Apply patterns to extract technical terms
        for pattern in tech_patterns:
            matches = re.findall(pattern, point.lower())
            skills.update(matches)
        
        # Add noun phrases that might be skills
        point_doc = nlp(point)
        for chunk in point_doc.noun_chunks:
            if 2 <= len(chunk.text.split()) <= 3:  # Most skills are 1-3 words
                skills.add(chunk.text.lower())
    
    # Extract from entire text using NER and patterns
    for pattern in tech_patterns:
        matches = re.findall(pattern, text.lower())
        skills.update(matches)
    
    # Look for phrases like "experience with X" or "knowledge of X"
    experience_patterns = [
        r'experience (?:with|in|of) ([a-zA-Z0-9\s/\-\+]+)',
        r'knowledge (?:of|in) ([a-zA-Z0-9\s/\-\+]+)',
        r'proficient (?:with|in) ([a-zA-Z0-9\s/\-\+]+)',
        r'familiarity (?:with) ([a-zA-Z0-9\s/\-\+]+)'
    ]
    
    for pattern in experience_patterns:
        for match in re.finditer(pattern, text.lower()):
            skill = match.group(1).strip()
            if 2 <= len(skill.split()) <= 5:  # Reasonable length for skill phrase
                skills.add(skill)
    
    # Clean up skills
    cleaned_skills = set()
    for skill in skills:
        # Basic cleaning
        skill = skill.strip().lower()
        skill = re.sub(r'[^\w\s/\-\+]', '', skill)  # Remove punctuation except slashes
        skill = re.sub(r'\s+', ' ', skill)          # Normalize spaces
        
        if skill and len(skill) > 2:
            cleaned_skills.add(skill)
    
    return list(cleaned_skills)


def compute_resume_jd_match(resume_text, jd_text, resume_skills, jd_skills):
    """
    Compute the match between a resume and job description.
    Returns match metrics.
    """
    # Calculate TF-IDF similarity between full texts
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        overall_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except:
        # Fallback if vectorizer fails
        overall_similarity = 0.0
    
    # Calculate skill match rate
    if jd_skills:
        resume_skills_lower = [s.lower() for s in resume_skills]
        jd_skills_lower = [s.lower() for s in jd_skills]
        
        # Find exact matches
        exact_matches = []
        for jd_skill in jd_skills_lower:
            if jd_skill in resume_skills_lower:
                exact_matches.append(jd_skill)
        
        # Find partial matches (e.g., "Python programming" matches "Python")
        partial_matches = []
        for jd_skill in jd_skills_lower:
            if jd_skill not in exact_matches:
                # Check if the job skill is contained within any resume skill
                if any(jd_skill in rs for rs in resume_skills_lower):
                    partial_matches.append(jd_skill)
                    continue
                    
                # Check if any resume skill is contained within the job skill
                if any(rs in jd_skill for rs in resume_skills_lower):
                    partial_matches.append(jd_skill)
                    continue
                    
                # Check for word-level matches (e.g., "AWS experience" partially matches "AWS")
                jd_skill_words = jd_skill.split()
                if any(any(word in rs and len(word) > 2 for word in jd_skill_words) for rs in resume_skills_lower):
                    partial_matches.append(jd_skill)
        
        # Calculate match percentages
        exact_match_rate = len(exact_matches) / len(jd_skills) if jd_skills else 0
        total_match_rate = (len(exact_matches) + len(partial_matches)) / len(jd_skills) if jd_skills else 0
        
        # Missing important skills
        missing_skills = [s for s in jd_skills if s.lower() not in exact_matches and s.lower() not in partial_matches]
    else:
        exact_match_rate = 0
        total_match_rate = 0
        exact_matches = []
        partial_matches = []
        missing_skills = []
    
    return {
        'overall_similarity': overall_similarity,
        'exact_match_rate': exact_match_rate,
        'total_match_rate': total_match_rate,
        'matched_skills': exact_matches,
        'partial_matches': partial_matches,
        'missing_skills': missing_skills
    }


def analyze_resume_structure(data, text):
    """
    Analyze resume structure and completeness.
    Returns structure metrics and recommendations.
    """
    recommendations = []
    
    # Check for missing sections
    if not data.get('name'):
        recommendations.append("Missing name - ensure your full name is clearly visible at the top")
    
    if not data.get('email'):
        recommendations.append("Missing email - include a professional email address")
    
    if not data.get('phone'):
        recommendations.append("Missing phone number - include a contact number")
    
    # Check for skills section
    if not data.get('skills') or len(data.get('skills', [])) < 5:
        recommendations.append("Skills section is missing or too brief - include 10+ relevant skills")
    
    # Check experience entries
    experiences = data.get('experience', [])
    if not experiences:
        recommendations.append("No work experience found - include your work history with achievements")
    else:
        has_dates = False
        for exp in experiences:
            # Look for date information
            if re.search(r'\d{4}', str(exp)):
                has_dates = True
                break
        if not has_dates:
            recommendations.append("Work experience is missing years/dates - include specific time periods")
    
    # Check for bullet points in experience section
    bullet_point_found = False
    for exp in experiences:
        if re.search(r'(?:^|\n)(?:•|-|\*)', str(exp)):
            bullet_point_found = True
            break
    if not bullet_point_found:
        recommendations.append("Consider using bullet points to highlight achievements and responsibilities")
    
    # Education check
    if not data.get('education'):
        recommendations.append("Education section is missing - include your educational background")
    
    # Check for quantifiable achievements
    achievement_pattern = r'\b(?:increased|decreased|improved|achieved|created|developed|managed|led)\b.*?\b\d+%?\b'
    if not re.search(achievement_pattern, text, re.IGNORECASE):
        recommendations.append("Consider adding quantifiable achievements (e.g., 'Increased performance by 20%')")
    
    # Check for contact section at top
    first_section = '\n'.join(text.splitlines()[:10])
    if not (re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', first_section) or
            re.search(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', first_section)):
        recommendations.append("Ensure contact information is at the top of your resume")
    
    return recommendations


def main():
    if len(sys.argv) < 2:
        print("Usage: validate_ats.py <resume.pdf> [job_description.txt]")
        sys.exit(1)

    resume_path = sys.argv[1]
    job_description_provided = len(sys.argv) > 2
    jd_path = sys.argv[2] if job_description_provided else None
    
    if not os.path.exists(resume_path):
        print(f"Error: Resume file not found: {resume_path}")
        sys.exit(1)
    
    if job_description_provided and not os.path.exists(jd_path):
        print(f"Error: Job description file not found: {jd_path}")
        sys.exit(1)

    print("\nParsing resume using resume_parser...")
    # 1. Parse resume with resume_parser
    resume_data = extract_resume_data(resume_path)
    
    # Extract full text for additional analysis
    resume_text = resume_data.get('text', '')
    
    # 2. Analyze ATS compatibility
    ats_issues = analyze_resume_ats_compatibility(resume_path)
    
    # 3. Process job description if provided
    jd_text = ""
    jd_skills = []
    match_results = {}
    
    if job_description_provided:
        print("Analyzing job description...")
        with open(jd_path, 'r', encoding='utf-8') as f:
            jd_text = f.read()
        
        # Extract skills from job description
        jd_skills = extract_job_description_skills(jd_text)
        
        # Compute match between resume and job description
        match_results = compute_resume_jd_match(resume_text, jd_text, resume_data.get('skills', []), jd_skills)
    
    # 4. Analyze resume structure
    structure_recommendations = analyze_resume_structure(resume_data, resume_text)
    
    # 5. Generate specific recommendations
    recommendations = {}
    if job_description_provided:
        recommendations = generate_recommendations(resume_data, resume_text, jd_text, jd_skills, match_results, ats_issues)
    
    # 6. Output the comprehensive report
    print("\n" + "="*50)
    print("              ATS VALIDATION REPORT")
    print("="*50 + "\n")
    
    print("CONTACT INFORMATION:")
    print(f"  Name: {resume_data.get('name', 'Not found')}")
    print(f"  Email: {resume_data.get('email', 'Not found')}")
    print(f"  Phone: {resume_data.get('phone', 'Not found')}")
    
    print("\nRESUME SECTIONS DETECTED:")
    if resume_data.get('skills'):
        print(f"  Skills: {len(resume_data.get('skills', []))} skills found")
    else:
        print("  Skills: None detected")
        
    if resume_data.get('experience'):
        print(f"  Experience: {len(resume_data.get('experience', []))} entries found")
    else:
        print("  Experience: None detected")
        
    if resume_data.get('education'):
        print(f"  Education: {len(resume_data.get('education', []))} entries found")
    else:
        print("  Education: None detected")
    
    print("\nATS COMPATIBILITY ISSUES:")
    if ats_issues:
        for issue in ats_issues:
            print(f"  ⚠️ {issue}")
    else:
        print("  ✓ No major ATS compatibility issues detected")
    
    print("\nRESUME STRUCTURE RECOMMENDATIONS:")
    if structure_recommendations:
        for rec in structure_recommendations:
            print(f"  • {rec}")
    else:
        print("  ✓ Resume structure looks good")
    
    if job_description_provided:
        print("\nJOB DESCRIPTION MATCH:")
        print(f"  Overall Text Similarity: {match_results['overall_similarity']*100:.1f}%")
        print(f"  Skill Match Rate: {match_results['total_match_rate']*100:.1f}%")
        
        print("\nSKILLS ANALYSIS:")
        print("  Skills Found in Resume:")
        if resume_data.get('skills'):
            for skill in resume_data.get('skills', [])[:15]:  # Limit to top 15 for readability
                print(f"    • {skill}")
            if len(resume_data.get('skills', [])) > 15:
                print(f"    • ... and {len(resume_data.get('skills', [])) - 15} more")
        else:
            print("    None found")
        
        print("\n  Skills Required in Job Description:")
        if jd_skills:
            for skill in jd_skills:
                if skill.lower() in [s.lower() for s in match_results['matched_skills']]:
                    print(f"    ✓ {skill}")
                elif skill.lower() in [s.lower() for s in match_results['partial_matches']]:
                    print(f"    ~ {skill} (partial match)")
                else:
                    print(f"    ✗ {skill} (missing)")
        else:
            print("    None extracted")
        
        print("\nRECOMMENDATIONS:")
        if recommendations:
            for category, recs in recommendations.items():
                print(f"  {category}:")
                for rec in recs:
                    print(f"    • {rec}")
        else:
            print("  Your resume is well-optimized for this job posting.")
    else:
        print("\nGENERAL RECOMMENDATIONS:")
        print("  • Keep formatting simple and consistent")
        print("  • Use standard section headings (Experience, Education, Skills)")
        print("  • Include keywords from job descriptions you apply to")
        print("  • Highlight achievements with metrics when possible")
        print("  • Tailor your resume for each application")
        print("  • Run this script with a job description file for more specific insights:")
        print("    python scripts/validate_ats.py output/resume.pdf templates/job_description_example.txt")
    
    print("\n" + "="*50)


def generate_recommendations(resume_data, resume_text, jd_text, jd_skills, match_results, ats_issues):
    """
    Generate specific recommendations to improve the resume for the target job.
    Returns a dictionary of recommendation categories and lists of recommendations.
    """
    recommendations = {}
    
    # ATS Compatibility Recommendations
    if ats_issues:
        ats_recs = []
        for issue in ats_issues:
            if "consecutive spaces" in issue:
                ats_recs.append("Remove tables or columns and use a simpler layout")
            elif "tab characters" in issue:
                ats_recs.append("Replace tab indentation with spaces for better ATS compatibility")
            elif "Non-ASCII" in issue:
                ats_recs.append("Replace special characters with standard ASCII characters")
            elif "Bullet points" in issue:
                ats_recs.append("Consider using simple dashes (-) instead of bullet points • for better compatibility")
            elif "All-caps" in issue:
                ats_recs.append("Use Title Case for headings instead of ALL CAPS to avoid spam filters")
            elif "headers/footers" in issue:
                ats_recs.append("Remove page numbers and headers/footers that may confuse ATS scanning")
            elif "Resume file size" in issue:
                ats_recs.append("Reduce file size by optimizing images or using a simpler PDF format")
        
        if ats_recs:
            recommendations["ATS Format Optimization"] = ats_recs
    
    # Skills Recommendations
    skill_recs = []
    if match_results['missing_skills']:
        top_missing = match_results['missing_skills'][:5]
        skill_recs.append(f"Add these key missing skills (if you have them): {', '.join(top_missing)}")
    
    if match_results['total_match_rate'] < 0.5:
        skill_recs.append("Improve keyword matching by using the exact terms from the job description")
    
    # Check if skills section is easy to find
    skills_section_pattern = r'\b(?:skills|expertise|technical\s+skills|core\s+competencies)\b(?:[:]\s*)'
    if not re.search(skills_section_pattern, resume_text, re.IGNORECASE):
        skill_recs.append("Add a clearly labeled 'Skills' section for better ATS recognition")
    
    if skill_recs:
        recommendations["Skills Optimization"] = skill_recs
    
    # Content Recommendations
    content_recs = []
    
    # Check for job title match
    jd_title = ""
    jd_title_match = re.search(r'^#\s*([^\n]+)', jd_text)
    if jd_title_match:
        jd_title = jd_title_match.group(1).strip()
        if jd_title.lower() not in resume_text.lower():
            content_recs.append(f"Include the exact job title '{jd_title}' in your resume")
    
    # Check for quantifiable achievements
    if not re.search(r'\b(?:increased|decreased|improved|achieved|created|developed|managed|led)\b.*?\b\d+%?\b', resume_text, re.IGNORECASE):
        content_recs.append("Add quantified achievements with metrics (e.g., 'Increased performance by 20%')")
    
    # Check for tailoring recommendation
    if match_results['overall_similarity'] < 0.3:
        content_recs.append("Tailor the summary/objective to specifically address the target role's requirements")
    
    if content_recs:
        recommendations["Content Improvements"] = content_recs
    
    # Structure Recommendations
    structure_recs = []
    
    # Check if the experience section has clear date ranges
    date_pattern = r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[-–—]\s*(?:Present|Current|\d{4}|\w+\s+\d{4})\b'
    if not re.search(date_pattern, resume_text, re.IGNORECASE):
        structure_recs.append("Use clear date ranges for each position (e.g., 'January 2020 - Present')")
    
    # Check for section organization
    if structure_recs:
        recommendations["Structure Improvements"] = structure_recs
    
    return recommendations


if __name__ == "__main__":
    main()