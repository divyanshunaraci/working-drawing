# Working Drawing Floor Plan Processing Server

A Flask-based web application for processing floor plan data with validation and outline generation capabilities.

## Features

- Floor plan validation and processing
- JSON-based API for floor plan data
- CORS-enabled for web integration
- Mathematical processing using NumPy and Matplotlib

## Prerequisites

- macOS (tested on macOS 15.0)
- Homebrew (for package management)
- Internet connection for downloading dependencies

## Installation & Setup

### 1. Install Miniconda

```bash
# Install miniconda via Homebrew
brew install miniconda
```

### 2. Initialize Conda

```bash
# Initialize conda for your shell
conda init zsh
# or for bash: conda init bash
```

### 3. Accept Conda Terms of Service

```bash
# Accept terms of service for conda channels
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
```

### 4. Create Conda Environment

```bash
# Create a new conda environment with Python 3.9
conda create -n working-drawing python=3.9 -y
```

### 5. Activate Environment and Install Dependencies

```bash
# Activate the conda environment
conda activate working-drawing

# Install all required packages via conda
conda install numpy matplotlib flask flask-cors requests -y
```

### 6. Navigate to Project Directory

```bash
cd pyserver
```

## Running the Server

### Start the Server

```bash
# Make sure you're in the pyserver directory
cd pyserver

# Activate conda environment
conda activate working-drawing

# Start the Flask server
python server.py
```

The server will start on `http://localhost:4000`

### Access the Application

- **Main Interface**: `http://localhost:4000`
- **API Endpoint**: `http://localhost:4000/json` (POST requests)

## API Usage

### JSON Processing Endpoint

**POST** `/json`

Send JSON data containing floor plan information for processing.

**Request Format:**
```json
{
  "project_details": {
    // project information
  },
  "rooms": [
    // room data
  ],
  "walls": [
    // wall data
  ]
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
│   ├── floor_plan_validation.py  # Floor plan validation logic
│   ├── floor_plan_outline.py     # Floor plan outline generation
│   ├── static/                  # Static web assets
│   │   ├── css/                 # Stylesheets
│   │   ├── js/                  # JavaScript files
│   │   └── assets/              # Images and icons
│   └── templates/               # HTML templates
│       └── index.html           # Main web interface
└── README.md                    # This file
```

## Dependencies

The application requires the following Python packages (installed via conda):

- **Flask** (3.1.2) - Web framework
- **Flask-CORS** (6.0.1) - Cross-origin resource sharing
- **NumPy** (2.0.1) - Mathematical operations
- **Matplotlib** (3.9.2) - Plotting and visualization
- **Requests** (2.32.5) - HTTP library

## Troubleshooting

### Common Issues

1. **Conda not found**: Make sure to run `conda init` and restart your terminal
2. **Python 2/3 compatibility**: The code was originally written for Python 2.7 but has been adapted for Python 3.9
3. **Port already in use**: If port 4000 is busy, modify `server.py` to use a different port

### Environment Issues

If you encounter issues with the conda environment:

```bash
# Deactivate current environment
conda deactivate

# Remove and recreate environment
conda env remove -n working-drawing
conda create -n working-drawing python=3.9 -y
conda activate working-drawing
conda install numpy matplotlib flask flask-cors requests -y
```

## Development Notes

- The application processes floor plan data and generates validation reports
- Mathematical calculations are performed using NumPy
- Visualization capabilities are provided by Matplotlib
- The server runs in debug mode by default for development

## License

This project is part of the Decorpot working drawing system.

## Support

For technical support or questions about the floor plan processing system, please contact the development team.
