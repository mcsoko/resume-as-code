#!/usr/bin/env python3
import argparse
import yaml
import jinja2
import sys
import os
import re

def merge_dict(a, b, parent_append_mode=None, parent_merge_mode=None):
    """Simple recursive merge with Helm-like append control.
    
    Special keys in the overlay dict:
    - '_append': Controls which fields should append instead of replace
                 Can be True (for all lists), a list of field names, or a dict mapping paths to field names
    - '_merge': Controls which fields with dict values should be merged rather than replaced entirely
                Can be True (for all dicts), a list of field names, or a dict mapping paths to field names
    
    Examples:
    ```yaml
    # Append mode for all lists
    _append: true
    
    # Append mode for specific fields
    _append: [highlights, skill]
    
    # Append and merge specific fields
    _append: [highlights, skill]
    _merge: [metadata]
    ```
    """
    # Extract control flags - use parent flags if none defined at this level
    append_mode = b.get('_append', parent_append_mode if parent_append_mode is not None else False)
    merge_mode = b.get('_merge', parent_merge_mode if parent_merge_mode is not None else True)
    
    for k, v in b.items():
        # Skip special control keys
        if k.startswith('_'):
            continue
            
        if k in a:
            # Handle nested dictionaries
            if isinstance(a[k], dict) and isinstance(v, dict):
                # Check if we should merge this dict
                should_merge = (
                    merge_mode is True or
                    (isinstance(merge_mode, list) and k in merge_mode) or
                    (isinstance(merge_mode, dict) and k in merge_mode)
                )
                
                if should_merge:
                    # Recursive merge with the same control flags
                    merge_dict(a[k], v, append_mode, merge_mode)
                else:
                    # Replace the dict entirely
                    a[k] = v
            
            # Handle lists - append or replace
            elif isinstance(a[k], list) and isinstance(v, list):
                # Check if we should append this list
                should_append = (
                    append_mode is True or
                    (isinstance(append_mode, list) and k in append_mode) or
                    (isinstance(append_mode, dict) and k in append_mode)
                )
                
                if should_append:
                    # Append items to the existing list
                    a[k].extend(v)
                else:
                    # Replace the list entirely
                    a[k] = v
                    
            else:
                # For non-dict, non-list values, just replace
                a[k] = v
        else:
            # Key doesn't exist in a, just add it
            a[k] = v
    
    return a

def render_html(
    base_yaml_bytes: bytes,
    overlay_yaml_bytes: bytes = None,
    template_bytes: bytes = None,
    template_file: str = None,
    css_bytes: bytes = None
) -> str:
    """
    Render resume data to HTML, merging base and overlay YAML into a Jinja2 template.
    """
    import yaml, jinja2, os

    # Load base YAML
    data = yaml.safe_load(base_yaml_bytes)

    # Merge overlay if provided
    if overlay_yaml_bytes:
        overlay = yaml.safe_load(overlay_yaml_bytes)
        merge_dict(data, overlay)

    # Prepare Jinja2 template
    if template_bytes:
        # Render directly from provided template string
        tpl = template_bytes.decode('utf-8')
        template = jinja2.Environment(
            loader=jinja2.BaseLoader(),
            autoescape=True
        ).from_string(tpl)
    else:
        # Fallback to loading from a file path
        if not template_file:
            raise ValueError("No template_bytes or template_file provided")
        tpl_path = os.path.abspath(template_file)
        tpl_dir = os.path.dirname(tpl_path)
        tpl_name = os.path.basename(tpl_path)
        env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(tpl_dir),
            autoescape=True
        )
        template = env.get_template(tpl_name)

    rendered_html = template.render(resume=data)
    # Inline CSS if provided
    if css_bytes:
        css = css_bytes.decode('utf-8')
        # Attempt to inject before </head> (case-insensitive)
        if re.search(r'</head>', rendered_html, flags=re.IGNORECASE):
            rendered_html = re.sub(
                r'(?i)</head>',
                f"<style>\n{css}\n</style></head>",
                rendered_html,
                count=1
            )
        # Fallback to injecting after opening <head ...> tag
        elif re.search(r'<head[^>]*>', rendered_html, flags=re.IGNORECASE):
            rendered_html = re.sub(
                r'(?i)(<head[^>]*>)',
                lambda m: f"{m.group(1)}\n<style>\n{css}\n</style>",
                rendered_html,
                count=1
            )
        else:
            # No head tag found; prepend style at top
            rendered_html = f"<style>\n{css}\n</style>\n" + rendered_html
    return rendered_html

def main():
    p = argparse.ArgumentParser(
        description="Render a resume YAML through a Jinja2 template."
    )
    p.add_argument("base", help="Base resume YAML file")
    p.add_argument("output", help="Output HTML file")
    p.add_argument(
        "--overlay", "-o", help="Optional overlay YAML to merge on top of base"
    )
    p.add_argument(
        "--template-file", "-t",
        default="templates/resume.html.j2",
        help="Path to the Jinja2 template file"
    )
    p.add_argument(
        "--css-file", "-c",
        help="Optional CSS file to embed in the rendered HTML"
    )
    args = p.parse_args()

    # Read input files as bytes
    with open(args.base, 'rb') as f:
        base_bytes = f.read()
    overlay_bytes = None
    if args.overlay:
        with open(args.overlay, 'rb') as f:
            overlay_bytes = f.read()
    # Read template file as bytes
    with open(args.template_file, 'rb') as f:
        template_bytes = f.read()

    css_bytes = None
    if args.css_file:
        with open(args.css_file, 'rb') as f:
            css_bytes = f.read()

    # Render HTML using reusable function
    rendered = render_html(
        base_yaml_bytes=base_bytes,
        overlay_yaml_bytes=overlay_bytes,
        template_bytes=template_bytes,
        css_bytes=css_bytes
    )

    with open(args.output, 'w') as f:
        f.write(rendered)

    print(f"Rendered resume to {args.output} using template '{os.path.basename(args.template_file)}'")

if __name__ == "__main__":
    main()