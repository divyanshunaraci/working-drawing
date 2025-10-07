# Working Drawing Backend

Floor plan processing API built with Python 3.9+ and Flask.

## Setup (One-time)

```bash
cd pyserver
python3 -m venv venv_py3
source venv_py3/bin/activate
pip install -r requirements_py3.txt
```

## Run Server (Every time)

```bash
cd pyserver
./start_py3.sh
```

Server: http://localhost:4000

## API

- `GET /` - Web interface  
- `POST /json` - Process floor plan data

## Requirements

- Python 3.9+
- Dependencies in `requirements_py3.txt`