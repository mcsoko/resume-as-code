#!/usr/bin/env python3
"""
Test script for the resume parser implementation
"""
import os
import sys
import argparse

# Add the parent directory to the path so we can import the backend module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.extract_parse_pipeline import ResumeParser

def test_parser(pdf_path, skills=None, jd_keywords=None):
    """
    Test the resume parser with a given PDF file
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return False
        
    print(f"Testing resume parser with: {pdf_path}")
    
    if skills:
        print(f"Looking for skills: {', '.join(skills)}")
    
    if jd_keywords:
        print(f"Job description keywords: {', '.join(jd_keywords)}")
    
    # Create parser instance
    parser = ResumeParser(pdf_path, skills or [], jd_keywords or [])
    
    # Test text extraction
    print("\nTesting text extraction...")
    text = parser.extract_text()
    print(f"Extracted {len(text)} characters of text")
    if text:
        print(f"Text preview: {text[:200]}...")
    else:
        print("Warning: No text extracted from PDF")
    
    # Test full parsing
    print("\nTesting full parsing...")
    result = parser.parse()
    
    # Print results summary
    print("\nParsing Results:")
    for key, value in sorted(result.items()):
        if key == 'extracted_text':
            print(f"- {key}: {len(value)} characters")
        elif isinstance(value, list) and len(value) > 5:
            print(f"- {key}: {len(value)} items")
            # Print first few items
            for item in value[:5]:
                print(f"  - {item}")
            print("  - ...")
        else:
            print(f"- {key}: {value}")
    
    return True

def main():
    parser = argparse.ArgumentParser(description="Test the resume parser implementation")
    parser.add_argument('pdf_path', help='Path to a resume PDF file')
    parser.add_argument('--skills', help='Comma-separated list of skills to look for')
    parser.add_argument('--keywords', help='Comma-separated list of job description keywords')
    
    args = parser.parse_args()
    
    skills = args.skills.split(',') if args.skills else None
    keywords = args.keywords.split(',') if args.keywords else None
    
    test_parser(args.pdf_path, skills, keywords)

if __name__ == "__main__":
    main() 