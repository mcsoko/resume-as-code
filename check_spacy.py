#!/usr/bin/env python3
import spacy
print(f'spaCy version: {spacy.__version__}')

try:
    nlp = spacy.load('en_core_web_lg')
    print('en_core_web_lg model loaded successfully')
except Exception as e:
    print(f'Error loading model: {e}') 