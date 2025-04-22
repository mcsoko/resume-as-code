#!/bin/bash

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <base_resume.yaml> <output.html> [overlay.yaml]"
    exit 1
fi

BASE_RESUME="$1"
OUTPUT="$2"
OVERLAY="$3"

# Create a temporary file for merged YAML
TEMP_YAML=$(mktemp)

# If overlay is provided, merge it with base
if [ -n "$OVERLAY" ]; then
    # Merge YAML files using yq
    yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "$BASE_RESUME" "$OVERLAY" > "$TEMP_YAML"
else
    # Just use base resume
    cp "$BASE_RESUME" "$TEMP_YAML"
fi

# Render using Python's jinja2 CLI
python3 -c "
import yaml
import jinja2
import sys

# Load YAML data
with open('$TEMP_YAML', 'r') as f:
    data = yaml.safe_load(f)

# Load and render template
env = jinja2.Environment(loader=jinja2.FileSystemLoader('templates'))
template = env.get_template('resume.html.j2')
rendered = template.render(resume=data)

# Write output
with open('$OUTPUT', 'w') as f:
    f.write(rendered)
"

# Clean up
rm "$TEMP_YAML"

echo "Rendered resume to $OUTPUT" 