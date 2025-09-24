# Working Drawing Floor Plan Processing Server

A Flask-based web application for processing floor plan data with validation and outline generation capabilities.

## Quick Start

### Prerequisites
- macOS with Homebrew installed
- Internet connection

### Setup & Run

1. **Install Miniconda**
   ```bash
   brew install miniconda
   ```

2. **Setup Environment**
   ```bash
   # Initialize conda (restart terminal after this step)
   conda init zsh
   
   # Accept terms of service
   conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
   conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
   
   # Create environment with Python 3.9
   conda create -n working-drawing python=3.9 -y
   
   # Activate environment and install dependencies
   conda activate working-drawing
   conda install numpy matplotlib flask flask-cors requests -y
   ```

3. **Start the Server**
   ```bash
   cd pyserver
   
   # If you have pyenv installed, disable it temporarily
   unset PYENV_ROOT && unset PYENV_VERSION
   export PATH="/opt/homebrew/Caskroom/miniconda/base/envs/working-drawing/bin:$PATH"
   
   python server.py
   ```

4. **Access the Application**
   - **Web Interface**: http://localhost:4000
   - **API Endpoint**: http://localhost:4000/json

## API Usage

**POST** `/json` - Process floor plan data

**Request Format:**
```json
{
  "project_details": { /* project information */ },
  "rooms": [ /* room data */ ],
  "walls": [ /* wall data */ ]
}
```

**Response:**
- Success: Processed floor plan data with dimensions and validation
- Error: Error log with validation issues

## Project Structure

```
working-drawing/
├── pyserver/
│   ├── server.py                 # Main Flask application
│   ├── floor_plan_validation.py  # Validation logic
│   ├── floor_plan_outline.py     # Outline generation
│   ├── static/                   # Web assets (CSS, JS, images)
│   └── templates/                # HTML templates
└── README.md
```

## Troubleshooting

**Server won't start?**
- Make sure conda environment is activated: `conda activate working-drawing`
- If using pyenv, disable it as shown in step 3 above
- Check if port 4000 is available: `lsof -i :4000`

**Environment issues?**
```bash
# Reset environment
conda deactivate
conda env remove -n working-drawing
conda create -n working-drawing python=3.9 -y
conda activate working-drawing
conda install numpy matplotlib flask flask-cors requests -y
```

## Features

- Floor plan validation and processing
- JSON-based API for floor plan data
- CORS-enabled for web integration
- Mathematical processing using NumPy and Matplotlib




Final Quick Start Commands (Divyanshu) -

# Navigate to project directory
cd pyserver

# Activate conda environment and disable pyenv interference
source /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh
conda activate working-drawing
unset PYENV_ROOT
unset PYENV_VERSION
export PATH="/opt/homebrew/Caskroom/miniconda/base/envs/working-drawing/bin:$PATH"

# Start the server
python server.py