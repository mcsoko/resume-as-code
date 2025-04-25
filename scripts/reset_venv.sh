#!/bin/bash

echo "🔄 Removing existing virtual environment..."
rm -rf .venv

echo "🚀 Creating new virtual environment..."
python3 -m venv .venv

echo "✅ Activating new virtual environment..."
source .venv/bin/activate

echo "📦 Installing dependencies from requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🎉 Virtual environment reset complete."