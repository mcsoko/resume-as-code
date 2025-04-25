#!/usr/bin/env python3
import os
from resume_parser import extract_text_from_pdf, extract_name, extract_contact_info, extract_position, extract_education, extract_experience, extract_skills

resume_path = "output/base.pdf"

if not os.path.exists(resume_path):
    print(f"Error: File {resume_path} not found")
    exit(1)

try:
    print(f"Parsing resume: {resume_path}")
    
    # Extract text from PDF
    text = extract_text_from_pdf(resume_path)
    print(f"Text length: {len(text)} characters")
    
    # Parse different components
    name = extract_name(text)
    contact_info = extract_contact_info(text)
    position = extract_position(text)
    education = extract_education(text)
    experience = extract_experience(text)
    skills = extract_skills(text)
    
    # Print the results
    print("\nExtracted data:")
    print(f"Name: {name}")
    print(f"Contact Info: {contact_info}")
    print(f"Position: {position}")
    print(f"Education: {education}")
    print(f"Experience: {len(experience)} entries")
    for i, exp in enumerate(experience):
        print(f"  Experience {i+1}: {exp}")
    print(f"Skills: {len(skills)} entries")
    for i, skill in enumerate(skills):
        print(f"  Skill {i+1}: {skill}")
    
except Exception as e:
    print(f"Error parsing resume: {e}") 