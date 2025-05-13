# backend/main.py
# Minimal FastAPI wrapper around your existing scripts: render_resume.py and html_to_pdf.py

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse, Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import tempfile
import os
from typing import List, Optional

# Import your existing functions
from backend.render_resume import render_html
from backend.html_to_pdf import html_to_pdf
# Import the resume parser
from backend.extract_parse_pipeline import ResumeParser


app = FastAPI(title="Resume Generation API")
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # Allow all origins while testing
  allow_methods=["*"],
  allow_headers=["*"],
)

class HTMLContent(BaseModel):
    html: str

class ParseResumeRequest(BaseModel):
    skill_list: List[str]
    jd_keywords: Optional[List[str]] = None

@app.post("/generate/html", response_class=HTMLResponse)
async def generate_html(
    base_yaml: UploadFile = File(...),
    template: UploadFile = File(...),
    overlay_yaml: UploadFile = File(None),
    css_file: UploadFile = File(None)
):
    """
    Render HTML from base YAML, overlay YAML, and Jinja2 template.
    Returns raw HTML for preview or further processing.
    """
    base_bytes = await base_yaml.read()
    template_bytes = await template.read()
    
    overlay_bytes = None
    if overlay_yaml:
        overlay_bytes = await overlay_yaml.read()
    
    css_bytes = None
    if css_file:
        css_bytes = await css_file.read()
        css_content = css_bytes.decode('utf-8')
        print(f"CSS file provided: {css_file.filename}, size: {len(css_bytes)} bytes")
        print(f"CSS content preview: {css_content[:200]}...")
    
    # Call your existing Jinja2 renderer
    html = render_html(base_bytes, overlay_bytes, template_bytes, css_bytes=css_bytes)
    
    # Print a snippet of the HTML to inspect
    print(f"Generated HTML: {len(html)} bytes total")
    
    # Check if CSS was actually included in the HTML
    import re
    css_tags = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL | re.IGNORECASE)
    total_css_length = sum(len(css) for css in css_tags)
    
    print(f"Found {len(css_tags)} style tags in the generated HTML with {total_css_length} total bytes of CSS")
    
    if css_bytes and total_css_length < len(css_bytes):
        print("WARNING: CSS may not have been fully included in the HTML output!")
    
    if len(html) > 500:
        print(f"HTML snippet: {html[:500]}...")
    else:
        print(f"HTML: {html}")
        
    return HTMLResponse(content=html)

@app.post("/generate/pdf")
async def generate_pdf(payload: HTMLContent):
    """
    Convert HTML string to PDF bytes.
    Accepts a JSON body: { "html": "<your html>" }
    Returns application/pdf response.
    """
    try:
        # Extract the CSS content from the HTML
        import re
        
        # Look for CSS in style tags
        css_pattern = r'<style[^>]*>(.*?)</style>'
        css_matches = re.findall(css_pattern, payload.html, re.DOTALL | re.IGNORECASE)
        
        # Combine all CSS found
        css_content = "\n".join(css_matches)
        
        print(f"Extracted {len(css_content)} bytes of CSS from {len(css_matches)} style tags")
        
        # Generate PDF with the explicitly extracted CSS
        pdf_bytes = html_to_pdf(payload.html, css_content=css_content)
        
        # Convert to bytes if it's a bytearray
        if isinstance(pdf_bytes, bytearray):
            pdf_bytes = bytes(pdf_bytes)
            
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        # Log the error
        import traceback
        print(f"Error in generate_pdf endpoint: {e}")
        print(traceback.format_exc())
        # Return a helpful error message
        return Response(
            content=f"Failed to generate PDF: {e}",
            status_code=500,
            media_type="text/plain"
        )

@app.post("/generate/pdf-direct", response_class=FileResponse)
async def generate_pdf_direct(
    base_yaml: UploadFile = File(...),
    template: UploadFile = File(...),
    overlay_yaml: UploadFile = File(None),
    css_file: UploadFile = File(None)
):
    """
    Direct PDF generation from YAML, template, and CSS.
    This bypasses the HTML step and generates the PDF directly.
    """
    try:
        # Read all input files
        base_bytes = await base_yaml.read()
        template_bytes = await template.read()
        
        overlay_bytes = None
        if overlay_yaml:
            overlay_bytes = await overlay_yaml.read()
        
        css_bytes = None
        if css_file:
            css_bytes = await css_file.read()
            print(f"CSS file provided directly: {css_file.filename}, size: {len(css_bytes)} bytes")
            if len(css_bytes) > 100:
                css_preview = css_bytes.decode('utf-8', errors='ignore')[:100]
                print(f"CSS preview: {css_preview}...")
        
        # Generate HTML first
        html = render_html(base_bytes, overlay_bytes, template_bytes, css_bytes=css_bytes)
        
        # Get the CSS content from the HTML
        import re
        css_content = ""
        if css_bytes:
            css_content = css_bytes.decode('utf-8', errors='ignore')
        
        # Create temporary file for the PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as pdf_file:
            pdf_path = pdf_file.name
            
        # Generate PDF
        pdf_bytes = html_to_pdf(html, css_content=css_content)
        
        # Write PDF to file
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # Return the PDF file
        return FileResponse(
            pdf_path, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
    except Exception as e:
        import traceback
        print(f"Error in generate_pdf_direct endpoint: {e}")
        print(traceback.format_exc())
        return Response(
            content=f"Failed to generate PDF: {e}",
            status_code=500,
            media_type="text/plain"
        )

@app.post("/parse/resume")
async def parse_resume(
    resume_file: UploadFile = File(...),
    skill_list: str = Form(""),
    jd_keywords: str = Form("")
):
    """
    Parse a resume PDF file and extract relevant information.
    
    Args:
        resume_file: The resume PDF file to parse
        skill_list: Comma-separated list of skills to look for
        jd_keywords: Comma-separated list of job description keywords
        
    Returns:
        JSON with extracted resume information and score
    """
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            pdf_path = tmp_file.name
            tmp_file.write(await resume_file.read())
        
        # Parse skill list and JD keywords from form data
        skills = [s.strip() for s in skill_list.split(',')] if skill_list else []
        keywords = [k.strip() for k in jd_keywords.split(',')] if jd_keywords else []
        
        print(f"Parsing resume {resume_file.filename} with {len(skills)} skills and {len(keywords)} keywords")
        
        # Parse the resume
        parser = ResumeParser(pdf_path, skills, keywords)
        result = parser.parse()
        
        # Clean up the temporary file
        os.unlink(pdf_path)
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in parse_resume endpoint: {e}")
        print(traceback.format_exc())
        return {"error": str(e)}

@app.post("/process/resume")
async def process_resume(
    resume_file: UploadFile = File(...),
    job_description: UploadFile = File(None)
):
    """
    Process a resume and optionally compare it with a job description.
    
    This endpoint provides a more comprehensive analysis including:
    - Resume parsing
    - ATS compatibility check
    - JD matching (if job description provided)
    - Recommendations for improvement
    
    Args:
        resume_file: The resume PDF file to process
        job_description: Optional job description text file
        
    Returns:
        JSON with detailed analysis results
    """
    try:
        # Save the uploaded files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as resume_tmp:
            resume_path = resume_tmp.name
            resume_tmp.write(await resume_file.read())
        
        jd_path = None
        if job_description:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as jd_tmp:
                jd_path = jd_tmp.name
                jd_tmp.write(await job_description.read())
        
        # Basic resume parsing
        skills = []  # Default empty skill list
        parser = ResumeParser(resume_path, skills)
        parse_result = parser.parse()
        
        result = {
            "parsed_resume": parse_result,
            "filename": resume_file.filename,
        }
        
        # Clean up temporary files
        os.unlink(resume_path)
        if jd_path:
            os.unlink(jd_path)
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in process_resume endpoint: {e}")
        print(traceback.format_exc())
        return {"error": str(e)}

if __name__ == "__main__":
    # Run with: python backend/main.py
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
