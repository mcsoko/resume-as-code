#!/usr/bin/env python3
"""
HTML to PDF Converter for Resume

This script converts an HTML resume to a PDF file using WeasyPrint.
"""

import argparse
import os
import shutil
from pathlib import Path
from weasyprint import HTML, CSS

# Shared print CSS for both file-based and string-based conversion
CSS_STRING = '''
    @page {
        size: letter;
        margin: 0.5in;
    }
    @media print {
        body {
            font-size: 11pt;
        }
        
        .section-header:before,
        .section-header:after {
            border-top: 1px dashed var(--accent) !important;
            width: 35% !important;
        }
        
        .skill-item {
            margin-right: 15px;
        }
        
        /* Ensure proper breaking across pages */
        .experience-item {
            page-break-inside: avoid;
        }
        
        /* Add some breathing room at top of pages */
        h2 {
            margin-top: 10px;
        }
        
        /* Better list appearance in PDF */
        .highlights li {
            list-style-type: disc;
            margin-left: 5px;
        }
    }
'''

def html_to_pdf(html_content: str) -> bytes:
    """
    Convert HTML content to PDF bytes using WeasyPrint.
    """
    # Generate PDF bytes using shared print CSS
    pdf_bytes = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=CSS_STRING)])
    return pdf_bytes

def convert_html_to_pdf(html_path, pdf_path):
    """
    Convert HTML file to PDF using WeasyPrint.
    
    Args:
        html_path: Path to the HTML file
        pdf_path: Path to save the PDF file
    """
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(pdf_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Custom print CSS
    additional_css = CSS(string=CSS_STRING)
    
    # Convert HTML to PDF
    print(f"Converting {html_path} to {pdf_path}...")
    try:
        # WeasyPrint will automatically find linked stylesheets in the HTML
        html = HTML(filename=html_path)
        html.write_pdf(pdf_path, stylesheets=[additional_css])
        print(f"Successfully generated {pdf_path}")
        return True
    except Exception as e:
        print(f"Error converting HTML to PDF: {e}")
        return False

def main():
    """
    Parse command line arguments and convert HTML to PDF.
    """
    parser = argparse.ArgumentParser(description='Convert HTML resume to PDF')
    parser.add_argument('html_path', help='Path to the HTML file')
    parser.add_argument('pdf_path', help='Path to save the PDF file')
    
    args = parser.parse_args()
    
    convert_html_to_pdf(args.html_path, args.pdf_path)

if __name__ == "__main__":
    main() 