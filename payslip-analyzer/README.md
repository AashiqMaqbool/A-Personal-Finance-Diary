# Payslip Analyzer - Python Backend

AI-powered payslip analysis service using Flask and PyPDF2.

## Quick Setup

### Option 1: Run install script (Windows)
```bash
install.bat
```

### Option 2: Manual installation
```bash
pip install -r requirements.txt
```

## Start Server

```bash
python app.py
```

Server will run on http://localhost:5000

## Troubleshooting

If you get "PyCryptodome is required" error:
```bash
pip install pycryptodome
```

## API Endpoints

- POST /analyze-payslip - Upload and analyze payslip
- GET /health - Health check

## Supported Formats

- PDF (text-based, not scanned images)
- TXT
- DOC/DOCX (as text)
