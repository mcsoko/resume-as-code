# ATS Validation Tool Setup Guide

The resume ATS validation script (`validate_ats.py`) is designed to provide detailed insights into how your resume will perform when processed by Applicant Tracking Systems (ATS). To ensure you get the full range of specialized resume analysis capabilities, follow this setup guide.

## Prerequisites

The script requires **Python 3.9-3.10** for best compatibility with all the specialized resume parsing libraries. It will not work properly with Python 3.13 due to compatibility issues with some dependencies.

## Setup Instructions

### Step 1: Create a Python 3.9 Virtual Environment

First, ensure you have Python 3.9 installed on your system. Then create a dedicated virtual environment:

```bash
# If using pyenv to manage Python versions
pyenv install 3.9.18  # Install Python 3.9
pyenv local 3.9.18    # Set local version

# Create a virtual environment
python -m venv .venv_ats
source .venv_ats/bin/activate  # On macOS/Linux
# or
# .venv_ats\Scripts\activate  # On Windows
```

### Step 2: Install Required Packages

With the virtual environment activated, install all the required packages:

```bash
pip install pdfminer.six nltk spacy scikit-learn resume-parser
python -m spacy download en_core_web_md
python -m nltk.downloader punkt stopwords
```

### Step 3: Run the ATS Validation Script

You can run the script in two modes:

#### Basic Mode (Resume Only)

This analyzes your resume for ATS compatibility without job matching:

```bash
python scripts/validate_ats.py output/resume.pdf
```

#### Advanced Mode (Resume + Job Description)

For a comprehensive analysis including job matching and personalized recommendations:

```bash
python scripts/validate_ats.py output/resume.pdf templates/job_description_example.txt
```

You can use any job description text file. We recommend copying and pasting real job descriptions into a text file for the most accurate results.

## Understanding Results

The ATS validation report provides:

1. **Contact Information Analysis**: Checks if your contact details are properly detected
2. **Section Detection**: Confirms if key resume sections (skills, experience, education) are found
3. **ATS Compatibility Issues**: Identifies formatting or content that might cause problems with ATS
4. **Structure Recommendations**: Suggests ways to improve resume organization
5. **Job Match Analysis** (when using a job description):
   - Overall text similarity score
   - Skill match rate
   - List of matching, partially matching, and missing skills
6. **Specific Recommendations**: Tailored advice to improve your resume for the target position

## Important Notes

- The specialized resume analysis requires Python 3.9 or 3.10
- If you encounter any import errors, ensure all packages are correctly installed
- For best results, use real job descriptions from positions you're interested in
- PDF parsing may not be perfect - verify the detected sections match your actual resume

## Troubleshooting

If you encounter issues:

1. Ensure you're using Python 3.9 (check with `python --version`)
2. Verify all packages are installed correctly
3. Make sure your resume PDF is properly formatted (not a scanned image)
4. If using a job description, ensure it's a plain text file with proper encoding 