#!/usr/bin/env python3
"""
HTML to PDF Converter for Resume

This script converts an HTML resume to a PDF file with preserved formatting.
"""

import argparse
import os
import tempfile
import io
from pathlib import Path

def html_to_pdf(html_content: str, css_content: str = None) -> bytes:
    """
    Convert HTML content to PDF bytes with WeasyPrint, preserving all styling.
    
    Args:
        html_content: The HTML content to convert
        css_content: Optional CSS content to apply (in addition to any embedded CSS)
    """
    try:
        # Use WeasyPrint directly - we've installed compatible versions
        from weasyprint import HTML, CSS
        import re
        
        # Process the CSS to replace variables and add explicit styling
        processed_css = css_content
        if processed_css:
            # Process CSS to handle variables and pseudo-elements
            # First, look for CSS variable definitions
            root_vars = re.search(r':root\s*{([^}]+)}', processed_css)
            css_vars = {}
            
            if root_vars:
                var_matches = re.findall(r'--([a-zA-Z0-9-]+)\s*:\s*([^;]+);', root_vars.group(1))
                for var_name, var_value in var_matches:
                    css_vars[f'--{var_name}'] = var_value.strip()
                    print(f"Found CSS variable: --{var_name} = {var_value.strip()}")
            
            # Replace CSS variables with their actual values
            for var_name, var_value in css_vars.items():
                processed_css = processed_css.replace(f'var({var_name})', var_value)
                print(f"Replaced var({var_name}) with {var_value}")
            
            # Add specific handling for the section-header before/after
            section_header_styles = """
            /* Enhanced section header styling for PDF */
            .section-header {
                position: relative;
                margin: 1em 0;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .section-header:before,
            .section-header:after {
                content: "";
                display: inline-block;
                width: 15%;
                height: 1px;
                position: relative;
                vertical-align: middle;
                border-top: 1px dashed #888; /* Fallback if accent color isn't defined */
            }
            """
            
            processed_css = processed_css + "\n" + section_header_styles
        
        # Base CSS to ensure proper formatting
        base_css = """
        @page {
            size: letter;
            margin: 0.5in;
        }
        """
        
        # Create CSS objects array
        css_objects = [CSS(string=base_css)]
        
        # Add explicitly provided CSS if available
        if processed_css:
            print(f"Adding processed CSS ({len(processed_css)} bytes)")
            css_objects.append(CSS(string=processed_css))
        
        # Create an HTML object from content
        html = HTML(string=html_content)
        
        # Convert to PDF bytes directly with all stylesheets
        print(f"Converting HTML to PDF with {len(css_objects)} CSS objects")
        pdf_bytes = html.write_pdf(stylesheets=css_objects)
        
        print(f"Generated PDF: {len(pdf_bytes)} bytes")
        return pdf_bytes
    
    except Exception as e:
        # If WeasyPrint fails, use a simpler approach
        import traceback
        import sys
        print(f"WeasyPrint error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        
        try:
            # Fall back to a simpler approach using FPDF
            from fpdf import FPDF
            
            # Extract text from HTML
            content = extract_text_content(html_content)
            
            # Create PDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font('Arial', '', 12)
            
            # Add title
            pdf.cell(0, 10, "Resume", ln=True, align='C')
            pdf.ln(10)
            
            # Add content
            sanitized_content = sanitize_text(content)
            pdf.multi_cell(0, 10, sanitized_content)
            
            # Return PDF bytes
            output = pdf.output(dest='S')
            
            if isinstance(output, str):
                return output.encode('latin1')
            elif isinstance(output, bytearray):
                return bytes(output)
            else:
                return output
                
        except Exception as fallback_error:
            print(f"Fallback error: {fallback_error}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            raise

def sanitize_text(text):
    """
    Sanitize text to remove characters that might cause problems with PDF generation.
    """
    # Replace fancy quotes with simple ones
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    
    # Replace other problematic characters
    text = text.replace('–', '-').replace('—', '-')
    text = text.replace('•', '*')
    
    # Remove any remaining non-Latin1 characters
    return ''.join(c for c in text if ord(c) < 256)

def extract_text_content(html_content):
    """
    Extract readable text from HTML content.
    """
    import re
    
    # First, remove scripts and styles
    html_content = re.sub(r'<script.*?>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style.*?>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove all HTML tags
    text = re.sub(r'<.*?>', ' ', html_content)
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Decode HTML entities
    import html
    text = html.unescape(text)
    
    return text.strip()

def main():
    """
    Parse command line arguments and convert HTML to PDF.
    """
    parser = argparse.ArgumentParser(description='Convert HTML resume to PDF')
    parser.add_argument('html_path', help='Path to the HTML file')
    parser.add_argument('pdf_path', help='Path to save the PDF file')
    
    args = parser.parse_args()
    
    # Read HTML file
    with open(args.html_path, 'r') as f:
        html_content = f.read()
    
    # Convert to PDF
    pdf_bytes = html_to_pdf(html_content)
    
    # Write to file
    with open(args.pdf_path, 'wb') as f:
        f.write(pdf_bytes)
    
    print(f"Successfully generated {args.pdf_path}")

if __name__ == "__main__":
    main() 