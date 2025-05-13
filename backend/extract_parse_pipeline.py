#!/usr/bin/env python3
"""
extract_parse_pipeline.py

Enhanced pipeline to extract and parse key fields from PDF resumes using PyResParser,
with pre-processing steps to improve ATS accuracy:
- PDF text extraction with pdfplumber + Tesseract OCR fallback
- Cleaning to remove headers/footers and non-ASCII artifacts
- Delegation of field extraction to PyResParser
- Custom scoring based on skills, JD keywords, and experience
"""
import os
import sys
import re
import pdfplumber
from PIL import Image
import spacy
import spacy.matcher.matcher as matcher_mod
import traceback
from typing import Dict, List, Any, Optional

# 1. Patch spaCy to load the proper model for PyResParser
_original_spacy_load = spacy.load

def _patched_spacy_load(name, **kwargs):
    if os.path.basename(name) == "pyresparser":
        return _original_spacy_load("en_core_web_lg", **kwargs)
    return _original_spacy_load(name, **kwargs)

spacy.load = _patched_spacy_load

# 2. Patch Matcher for legacy signatures in PyResParser
class PatchedMatcher(matcher_mod.Matcher):
    def add(self, name, *args, **kwargs):
        patterns = [arg for arg in args if isinstance(arg, list)]
        return super().add(name, patterns, **kwargs)

matcher_mod.Matcher = PatchedMatcher
import spacy.matcher
spacy.matcher.Matcher = PatchedMatcher

# 3. Import PyResParser with fallback
try:
    from pyresparser import ResumeParser as PRP
    PYRESPARSER_AVAILABLE = True
except ImportError:
    print("Warning: PyResParser not available, using fallback implementation")
    PYRESPARSER_AVAILABLE = False
    
    # Simple fallback implementation
    class PRP:
        def __init__(self, path):
            self.path = path
            
        def get_extracted_data(self):
            # Return basic dummy data when PyResParser isn't available
            return {
                "name": "Unknown",
                "email": [],
                "mobile_number": [],
                "skills": [],
                "college_name": [],
                "degree": [],
                "designation": [],
                "experience": [],
                "company_names": [],
                "total_experience": 0,
                "extracted_using": "fallback_implementation"
            }

class ResumeParser:
    def __init__(self, path: str, skill_list: list, jd_keywords: list = None):
        self.path = path
        self.skill_list = set(s.lower() for s in skill_list) if skill_list else set()
        self.jd_keywords = set(k.lower() for k in (jd_keywords or [])) if jd_keywords else set()

    def extract_text(self) -> str:
        """Extract text from PDF using pdfplumber with fallback to OCR if needed"""
        pages = []
        try:
            with pdfplumber.open(self.path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    if not text.strip() and hasattr(page, 'to_image'):
                        # If no text extracted, try OCR if available
                        try:
                            import pytesseract
                            img = page.to_image()
                            text = pytesseract.image_to_string(img.original)
                        except ImportError:
                            print("OCR not available (pytesseract not installed)")
                    pages.append(text)
            return "\n".join(pages)
        except Exception as e:
            print(f"Error extracting text: {e}")
            print(traceback.format_exc())
            return ""
            
    def extract_basic_info(self, text: str) -> Dict[str, Any]:
        """Basic parsing when PyResParser isn't available"""
        # Very simple parsing of some fields
        result = {
            "name": "Unknown",
            "email": [],
            "mobile_number": [],
            "skills": [],
            "extracted_using": "basic_regex_fallback"
        }
        
        # Try to extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            result["email"] = emails
            
        # Try to extract phone
        phone_pattern = r'\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
        phones = re.findall(phone_pattern, text)
        if phones:
            result["mobile_number"] = phones
            
        # Try to extract skills (if we have a skill list)
        if self.skill_list:
            text_lower = text.lower()
            found_skills = []
            for skill in self.skill_list:
                if skill.lower() in text_lower:
                    found_skills.append(skill)
            result["skills"] = found_skills
            
        return result

    def clean_text(self, text: str) -> str:
        """Clean extracted text to improve parsing accuracy"""
        if not text:
            return ""
            
        lines = text.splitlines()
        cleaned = []
        for line in lines:
            # Skip page numbers and headers/footers
            if re.match(r"^Page \d+ of \d+", line, re.I):
                continue
            if re.match(r"^\d+$", line.strip()):
                continue
            # Skip empty lines
            if not line.strip():
                continue
            cleaned.append(line)
        
        # Join lines and clean up spacing
        joined = "\n".join(cleaned)
        joined = re.sub(r"[ \t]{2,}", " ", joined)
        
        # Remove non-ASCII characters
        return joined.encode('ascii', errors='ignore').decode()

    def score(self, data: dict) -> int:
        """Calculate a match score based on skills, keywords, and experience"""
        score = 0
        resume_skills = [s.lower() for s in data.get('skills', [])]
        
        # Score based on skills
        for s in resume_skills:
            score += 5
            
        # Bonus for skills in our target list
        for s in self.skill_list & set(resume_skills):
            score += 10
        
        # Bonus for JD keyword matches
        for kw in self.jd_keywords & set(resume_skills):
            score += 15
            
        # Experience points
        exp = data.get('total_experience')
        try:
            if exp:
                score += int(float(exp)) * 2
        except (ValueError, TypeError):
            pass
            
        return score

    def parse(self) -> Dict[str, Any]:
        """Parse resume and extract structured data with scoring"""
        try:
            # Pre-process text to improve accuracy
            raw = self.extract_text()
            if not raw:
                return {"error": "Failed to extract text from PDF", "score": 0}
                
            clean = self.clean_text(raw)
            
            # Delegate field extraction to PyResParser or fallback
            if PYRESPARSER_AVAILABLE:
                try:
                    pr = PRP(self.path)
                    data = pr.get_extracted_data() or {}
                    data['parsed_with'] = "PyResParser"
                except Exception as e:
                    print(f"PyResParser failed: {e}, using fallback")
                    # If PyResParser fails, use basic extraction
                    data = self.extract_basic_info(clean)
            else:
                # Use our simple fallback parser
                data = self.extract_basic_info(clean) 
            
            # Add raw extracted text to the output
            data['extracted_text'] = clean
            
            # Attach custom score
            data['score'] = self.score(data)
            
            # Add metadata
            data['file_path'] = os.path.basename(self.path)
            
            # Ensure skills are present (even if empty)
            if 'skills' not in data:
                data['skills'] = []
                
            # Ensure consistent types for skills
            if data.get('skills') is None:
                data['skills'] = []
                
            # Parse contact section if available
            if 'email' in data and isinstance(data['email'], list) and data['email']:
                data['primary_email'] = data['email'][0]
                
            if 'mobile_number' in data and isinstance(data['mobile_number'], list) and data['mobile_number']:
                data['primary_phone'] = data['mobile_number'][0]
                
            # Add skills match info
            if self.skill_list:
                resume_skills_set = set(s.lower() for s in data.get('skills', []))
                data['matching_skills'] = list(self.skill_list & resume_skills_set)
                data['missing_skills'] = list(self.skill_list - resume_skills_set)
                data['skill_match_percentage'] = round(
                    (len(data['matching_skills']) / len(self.skill_list)) * 100 
                    if self.skill_list else 0
                )
                
            # Add JD keywords match info
            if self.jd_keywords:
                resume_text_lower = clean.lower()
                data['matching_keywords'] = [
                    kw for kw in self.jd_keywords 
                    if kw.lower() in resume_text_lower
                ]
                data['keyword_match_percentage'] = round(
                    (len(data['matching_keywords']) / len(self.jd_keywords)) * 100
                    if self.jd_keywords else 0
                )
                
            return data
        except Exception as e:
            print(f"Error parsing resume: {e}")
            print(traceback.format_exc())
            return {
                "error": str(e),
                "score": 0,
                "skills": [],
                "extracted_text": self.extract_text()
            }


def main(pdf_path: str, skills_list: List[str] = None, jd_keywords: List[str] = None):
    """Command-line entry point for resume parsing"""
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        sys.exit(1)
        
    # Use provided skills or defaults
    if skills_list is None:
        skills_list = ['python', 'java', 'javascript', 'react', 'node.js', 'sql', 'aws']
        
    # Use provided JD keywords or empty list
    if jd_keywords is None:
        jd_keywords = []

    print(f"Parsing resume: {pdf_path}")
    print(f"Looking for skills: {', '.join(skills_list)}")
    
    parser = ResumeParser(pdf_path, skills_list, jd_keywords)
    result = parser.parse()
    
    # Print the results
    print("\nExtracted Data:")
    for key, value in result.items():
        if key != 'extracted_text':  # Skip the full text to keep output clean
            print(f"{key}: {value}")
            
    print(f"\nResume Score: {result.get('score', 0)}")
    
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract_parse_pipeline.py <resume.pdf> [skill1,skill2,...] [jd_keyword1,jd_keyword2,...]")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    
    # Parse optional skill list from command line
    skills = None
    if len(sys.argv) > 2 and sys.argv[2]:
        skills = sys.argv[2].split(',')
        
    # Parse optional JD keywords from command line
    keywords = None
    if len(sys.argv) > 3 and sys.argv[3]:
        keywords = sys.argv[3].split(',')
        
    main(pdf_path, skills, keywords)
