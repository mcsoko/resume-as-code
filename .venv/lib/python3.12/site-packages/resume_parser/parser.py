import pdfplumber
import re
import json


def clean_text(text):
    return text.strip()


def extract_text_from_pdf(pdf_path):
    extracted_data = []
    with pdfplumber.open(pdf_path) as pdf:
        for pages in pdf.pages:
            pages_text = pages.extract_text()
            if pages_text and len(pages_text) > 10:
                extracted_data.append(pages_text)
    return "\n".join(extracted_data)


def extract_name(text):
    potential_name_lines = []
    lines = text.split('\n')

    title_keywords = ['engineer', 'manager', 'developer', 'director', 'officer', 'analyst', 'administrator',
                      'consultant', 'specialist', 'executive', 'assistant']
    # check first 10 line
    for line in lines[:10]:
        line = line.strip()

        # If the line has exactly two words, and both words are either title-cased or fully uppercase
        if len(line.split()) == 2 and all(word.istitle() or word.isupper() for word in line.split()):
            potential_name_lines.append(line)

        # If the line matches the pattern of a name (starts with an uppercase letter followed by lowercase letters)
        # and doesn't contain any job title keywords
        elif re.match(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)$', line):
            if not any(keyword in line.lower() for keyword in title_keywords):
                potential_name_lines.append(line)

        # If the line is fully uppercase and doesn't contain any job title keywords
        elif re.match(r'^([A-Z\s]+)$', line):
            if not any(keyword in line.lower() for keyword in title_keywords):
                potential_name_lines.append(line)

    # Format
    if potential_name_lines:
        name = potential_name_lines[0]
        if name.isupper():
            name_parts = name.split()
            if len(name_parts) == 2:
                first_name, last_name = name_parts
                return f"{first_name.capitalize()} {last_name.capitalize()}", text
            else:
                return name.title(), text

        return name.title(), text

    return "Not Found", text


def extract_contact_info(text):
    phone_pattern = r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'

    email = re.findall(email_pattern, text)
    phone = re.findall(phone_pattern, text)

    email = list(set(email))
    phone = list(set(phone))

    return {'email': email, 'phone': phone}


def extract_position(text):
    position_keywords = ['position', 'current role', 'job title', 'title', 'role', 'designation']
    lines = text.split('\n')
    position = "Not Found"

    for i in lines:
        if any(keyword in i.lower() for keyword in position_keywords):
            position_line = i.strip()
            text = text.replace(position_line, '', 1).strip()
            if ':' in position_line:
                position = position_line.split(':')[1].strip()
            elif position_line:
                position = position_line
            break
    return position


def extract_education(text):
    education_keywords = ['education', 'academic background', 'qualifications', 'degree', 'degrees', 'diploma']
    lines = text.split('\n')
    education = []
    capture = False

    for line in lines:
        line = line.strip()

        if any(keyword in line.lower() for keyword in education_keywords):
            capture = True
            education.append(line)
            text = text.replace(line, '', 1).strip()
            continue

        # if the current line is empty or contains keywords "experience" or "skills," the function assumes the
        # education section has ended
        if capture:
            if line == '' or 'experience' in line.lower() or 'skills' in line.lower():
                break
            else:
                education.append(line)
                text = text.replace(line, '', 1).strip()
    # removes any empty lines from the education list.
    education = [line for line in education if line]
    return education


def extract_experience(text):
    experience_keywords = [
        'experience', 'work history', 'professional background',
        'work experience', 'employment history', 'career summary'
    ]

    lines = text.split('\n')
    experience_section = []
    capture = False

    for line in lines:
        line = line.strip()

        # Check if the current line contains any of the experience-related keywords
        if any(keyword in line.lower() for keyword in experience_keywords):
            capture = True
            continue

        if capture:
            # if the current line is empty or contains keywords 'education', 'skills', 'languages', 'profile' the
            # function assumes the section has ended
            if line == '' or any(
                    keyword in line.lower() for keyword in ['education', 'skills', 'languages', 'profile']):
                break
            experience_section.append(line)

    # removes any empty lines
    experience_section = [line for line in experience_section if line]

    company_pattern = r'(?:Company Name:\s*)?([A-Z][\w\s,&]+\b)'
    date_pattern = r'\b(\d{4})(?:\s*[-–]\s*(\d{4}|Present|Current))?\b'
    job_title_pattern = r'(?:Position:\s*)?([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b'

    # Initialize an empty list to store structured work experience entries
    structured_experience = []
    # Initialize an empty dictionary to hold the current work experience entry
    current_entry = {}
    # Loop through each line in the captured experience_section
    for line in experience_section:
        # Search for a company name in the line using the company pattern
        company_match = re.search(company_pattern, line)
        if company_match and 'company' not in current_entry:
            # If a company name is found and not yet added to current_entry, add it
            current_entry['company'] = company_match.group(1)

        dates = re.findall(date_pattern, line)
        if dates:
            # If dates are found, separate the start and end dates
            start_date = dates[0][0]
            end_date = dates[0][1] if dates[0][1] else 'Present'
            # Add the dates to current_entry
            current_entry['dates'] = f"{start_date} - {end_date}"

        job_title_match = re.search(job_title_pattern, line)
        # If a job title is found and not yet added to current_entry, add it
        if job_title_match and 'job_title' not in current_entry:
            current_entry['job_title'] = job_title_match.group(1)

        # If company, dates, or job title are present in current_entry, add the line as part of the description
        if 'company' in current_entry or 'dates' in current_entry or 'job_title' in current_entry:
            current_entry.setdefault('description', []).append(line)

        # If company, dates, and job title are all present in current_entry
        if 'company' in current_entry and 'dates' in current_entry and 'job_title' in current_entry:
            # Combine all lines in the description into a single string
            current_entry['description'] = ' '.join(current_entry.get('description', [])).strip()
            # Add the current_entry to the structured_experience list
            structured_experience.append(current_entry)
            # Clear current_entry to start capturing a new entry
            current_entry = {}

    if current_entry:
        current_entry['description'] = ' '.join(current_entry.get('description', [])).strip()
        structured_experience.append(current_entry)

    # If there's any remaining data in current_entry after the loop, add it to structured_experience
    for entry in structured_experience:
        entry.setdefault('company', 'Unknown Company')
        entry.setdefault('dates', 'Unknown Dates')
        entry.setdefault('job_title', 'Unknown Job Title')
        entry.setdefault('description', 'No Description Available')

    return structured_experience


def extract_skills(text):
    skill_indicators = [
        'skills', 'expertise', 'proficient in', 'technologies', 'tools',
        'experience with', 'knowledge of', 'familiar with', 'competencies',
        'technical skills', 'abilities', 'specialties', 'qualifications',
        'strengths', 'areas of expertise', 'capabilities', 'mastery', 'proficiency'
    ]

    skills = []
    lines = text.lower().split('\n')

    for i, line in enumerate(lines):
        line = line.strip()
        # Check if the current line contains any of the skill indicators
        if any(indicator in line for indicator in skill_indicators):
            if ':' in line:
                # If the line contains a colon (':'), extract the part after the colon as the skills
                skills_line = line.split(':')[1].strip()
            elif i + 1 < len(lines):
                # If the line does not contain a colon, look at the next line for skills (if it exists)
                skills_line = lines[i + 1].strip()
            else:
                # If there's no next line, continue to the next iteration
                continue

            # If the extracted skills are separated by commas, split them and add to the skills list# If the
            # extracted skills are separated by commas, split them and add to the skills list
            if ',' in skills_line:
                skills.extend([skill.strip() for skill in skills_line.split(',')])
            # If the extracted skills are separated by hyphens, split them and add to the skills list
            elif '-' in skills_line:
                skills.extend([skill.strip() for skill in skills_line.split('-')])
            # If the skills are not separated by commas or hyphens, add the whole line as a skill
            else:
                skills.append(skills_line.strip())

    skills = list(set(skills))

    return skills


def main(pdf_path):
    extracted_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_text(extracted_text)

    # Extract the name from the cleaned text, and return the remaining text
    name, remaining_text = extract_name(cleaned_text)
    contact_info = extract_contact_info(remaining_text)
    position = extract_position(remaining_text)
    education = extract_education(remaining_text)
    experience = extract_experience(remaining_text)
    skills = extract_skills(remaining_text)

    resume_data = {
        "Name": name,
        "Contact Info": contact_info,
        "Position": position,
        "Education": education,
        "Experience": experience,
        "Skills": skills
    }

    return resume_data
