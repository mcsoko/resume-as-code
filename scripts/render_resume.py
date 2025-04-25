#!/usr/bin/env python3
import argparse
import yaml
import jinja2
import sys
import os

def merge_dict(a, b):
    """Recursively merge b into a."""
    for k, v in b.items():
        if k in a and isinstance(a[k], dict) and isinstance(v, dict):
            merge_dict(a[k], v)
        else:
            a[k] = v

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