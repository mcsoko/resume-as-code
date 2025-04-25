#!/usr/bin/env python3
import argparse
import yaml
import jinja2
import sys
import os

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
    args = p.parse_args()

    # Load and merge YAML
    with open(args.base, 'r') as f:
        data = yaml.safe_load(f)
    if args.overlay:
        with open(args.overlay, 'r') as f:
            overlay = yaml.safe_load(f)
        merge_dict(data, overlay)

    # Verify template exists
    tpl_path = os.path.abspath(args.template_file)
    if not os.path.isfile(tpl_path):
        sys.exit(f"Error: template file not found at '{tpl_path}'")

    # Set up Jinja2 loader to the template's directory
    tpl_dir  = os.path.dirname(tpl_path)
    tpl_name = os.path.basename(tpl_path)
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(tpl_dir),
        autoescape=True,
    )
    template = env.get_template(tpl_name)

    # Render and write
    rendered = template.render(resume=data)
    with open(args.output, 'w') as f:
        f.write(rendered)

    print(f"Rendered resume to {args.output} using template '{tpl_name}'")

if __name__ == "__main__":
    main()