#!/bin/bash
# Startup script for Python 3 upgraded backend

echo "🚀 Starting Working Drawing Backend (Python 3.9+)"
echo "=================================="

# Navigate to pyserver directory
cd "$(dirname "$0")"

# Activate Python 3 virtual environment
echo "📦 Activating Python 3 virtual environment..."
source venv_py3/bin/activate

# Check Python version
echo "🐍 Python version: $(python --version)"

# Install/update dependencies if needed
echo "📋 Checking dependencies..."
pip install -q -r requirements_py3.txt

# Start the Flask application
echo "🌐 Starting Flask server on http://localhost:4000"
echo "📝 Press Ctrl+C to stop the server"
echo "=================================="

python server.py
