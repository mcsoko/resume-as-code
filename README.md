# Resume-as-Code

A modern, maintainable approach to managing your resume with version control and automation.

## Features

- Base resume in YAML format for structured data
- Job-specific overlays for customizing content
- Automated generation of multiple formats:
  - HTML (beautiful, responsive web version)
  - PDF (professional print version via HTML-to-PDF)
- Template-based rendering using Jinja2
- Externalized CSS for easy style customization
- ATS (Applicant Tracking System) validation and scoring
- Job description matching and keyword analysis

## Prerequisites

1. Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   Mac OS dependencies:
   ````
   brew install cairo pango gdk-pixbuf libffi glib gobject-introspection
   ````
2. For the resume rendering script:
   ```bash
   pip install PyYAML jinja2
   ```

3. For PDF generation and ATS validation:
   ```bash
   pip install weasyprint resume-parser spacy
   python -m spacy download en_core_web_md
   ```

## Structure

```
.
├── resumes/
│   ├── base.yaml         # Your base resume
│   └── overlays/         # Job-specific overlays
│       └── overlay.yaml
├── templates/            # Jinja2 templates
│   └── resume.html.j2    # HTML template
├── css/
│   └── resume-styles.css # External CSS for styling
├── scripts/
│   ├── render_resume.py  # Python script to render HTML
│   ├── html_to_pdf.py    # Convert HTML to PDF using WeasyPrint
│   └── validate_ats.py   # ATS validation script
└── output/               # Generated files
```

## Usage

### Generating Resume HTML

````bash
# Default template at templates/resume.html.j2
python scripts/render_resume.py resumes/base.yaml output/resume.html
````
````bash
# Use a different template file
python scripts/render_resume.py resumes/base.yaml output/resume.html -t templates/academic.j2
````
````bash
# Merge an overlay
python scripts/render_resume.py resumes/base.yaml output/resume.html -o resumes/overlays/overlay.yaml
````

### Generate PDF via HTML
````bash
python scripts/html_to_pdf.py output/resume.html output/resume.pdf
````


### Hot-Reload Workflow for Styling

The resume uses an external CSS file for easy styling. This enables a browser reload workflow for fast visual tweaks:

1. Generate the HTML resume:
   ```bash
   python scripts/render_resume.py resumes/base.yaml output/resume.html
   ```

2. Open the generated HTML file in a browser:
   ```bash
   open output/resume.html
   ```

3. Edit the CSS file `css/resume-styles.css` in your text editor.

4. Simply refresh the browser to see styling changes immediately. No need to rerun any scripts when just tweaking styles.

5. Once you're satisfied with the styling, generate the PDF:
   ```bash
   python scripts/html_to_pdf.py output/resume.html output/resume.pdf
   ```

### HTML to PDF Conversion

The HTML-to-PDF conversion provides a simple way to generate professional PDFs from the HTML version of your resume:

```bash
python scripts/html_to_pdf.py <input-html-file> <output-pdf-file>
```

This approach offers several advantages:
- Consistent styling between web and print versions
- Better handling of modern CSS features
- No LaTeX installation required

### ATS Validation

The `validate_ats.py` script provides comprehensive ATS (Applicant Tracking System) validation and optimization features, helping you improve your resume for automated screening systems.

#### Running ATS Validation

To validate your resume against a job description:

```bash
python scripts/validate_ats.py <path-to-resume.pdf> <path-to-job-description.txt>
```

For example:
```bash
python scripts/validate_ats.py output/resume.pdf job_description.txt
```

#### Features of ATS Validation

The validation script provides:

1. **Resume Parsing**: Using the resume-parser library to extract structured data from your PDF resume
2. **ATS Compatibility Analysis**: Detecting formatting issues that could prevent your resume from being properly parsed
3. **Job Description Matching**: Comparing your resume against a job description to identify matching and missing skills
4. **Skills Analysis**: Extracting skills from both your resume and the job description
5. **Detailed Recommendations**: Categorized suggestions for improving your resume:
   - ATS Format Optimization
   - Skills Optimization
   - Content Improvements
   - Structure Improvements

#### Sample Output

The script generates a comprehensive report including:

- Contact information detected
- Resume sections identified
- ATS compatibility issues
- Resume structure recommendations
- Job description match percentage
- Skills analysis with matched and missing skills
- Detailed recommendations for improvement

## Resume Structure

A typical resume YAML structure includes:

- **metadata**: Name, title, location, and contact info
- **summary**: Professional summary/objective
- **skills**: Skills organized by category
  ```yaml
  skills:
    Technical:
      - "Languages: Python, JavaScript, TypeScript"
      - "Cloud: AWS, GCP, Azure"
    Leadership:
      - "Team Management"
      - "Agile Methodologies"
  ```
- **experience**: Work history with company, title, period, location, description, and highlights
- **education**: Educational background and certifications
- **publications**: Publications, presentations, and speaking engagements

## Overlays

Overlays are YAML files that can modify or extend your base resume. They can:
- Override metadata fields like title
- Replace the summary
- Add or modify skills by category
- Add or modify experience entries and highlights

Example overlay:
```yaml
# Use append mode for highlights but replace other fields
_append: [highlights]

metadata:
  title: "Senior Software Engineer"

summary: "Experienced software engineer specializing in cloud-native applications..."

skills:
  Technical:
    - "Cloud: AWS, Azure, GCP"
    - "Containerization: Docker, Kubernetes"
  Leadership:
    - "Team Management" 
    - "Agile Coaching"

experience:
  - company: "Tech Corp"
    title: "Senior Engineer" 
    highlights:
      - "Led migration of legacy systems to microservices architecture"
      - "Implemented CI/CD pipeline using GitHub Actions"
```

## Enhanced Merge System

The resume system includes a simple but powerful merging engine inspired by Helm's approach to merging YAML files.

### Merge Control Keys

The following special keys can be used in overlay files to control merging behavior:

- **`_append`**: Controls which lists should be appended rather than replaced
  - Can be `true` (for all lists)
  - Can be a list of field names (e.g., `[highlights, Technical, Leadership]`)

- **`_merge`**: Controls which dictionary fields should be merged rather than replaced
  - Defaults to `true` (merge all dictionaries)
  - Can be a list of field names to merge

### Simple Example

This example appends highlights while replacing skills:

```yaml
# Append only the highlights field
_append: [highlights]

# Skills to add (will replace existing skills)
skills:
  Leadership:
    - "Cross-functional Collaboration"
    - "Strategic Planning"
  Technical:
    - "GitOps"
    - "Service Mesh"

# Experience highlights to add (will be appended)
experience:
  - company: "ACME Corp"
    title: "Senior Engineer"
    highlights:
      - "Led migration to microservices architecture reducing deployment time by 80%"

# Add a certification (will replace any existing education)
education:
  - certification: "AWS Certified Solutions Architect"
```

### Global Append Mode

To append all lists in your overlay to the base resume:

```yaml
# Append all lists instead of replacing them
_append: true

skills:
  Leadership:
    - "New Skill 1"
    - "New Skill 2"

experience:
  - company: "New Company"
    title: "New Position"
    period: "2022 - Present"
    location: "Remote"
    highlights:
      - "Will be added as a new experience entry"
```

This merge system provides a simpler, more intuitive way to customize your resume for different job applications while maintaining a single source of truth in your base resume.

## ATS Optimization Tips

Based on validation results, here are some tips to improve your resume's ATS compatibility:

1. **Use relevant keywords**: Include keywords from the job description, especially in the skills and experience sections.
2. **Use a clean format**: Avoid tables, columns, headers/footers, and special characters.
3. **Use standard section headings**: "Experience," "Education," "Skills," etc.
4. **Use bullet points**: List accomplishments and responsibilities as bullet points.
5. **Avoid text in images**: ATS systems can't read text in images.
6. **Use standard file formats**: PDF is generally safe, but ensure text is selectable, not scanned.
7. **Include contact information**: Put your name, phone, email, and location at the top.
8. **Use a chronological format**: List your most recent experience first.
9. **Add quantifiable achievements**: Include metrics and numbers to demonstrate impact.
10. **Use industry-standard terminology**: Use common terms rather than company-specific jargon.

## Contributing

Feel free to submit issues and enhancement requests!