@echo off
echo Installing Python dependencies for Payslip Analyzer...
pip install Flask==3.0.0
pip install flask-cors==4.0.0
pip install PyPDF2==3.0.1
pip install pycryptodome==3.19.0
echo.
echo Installation complete!
echo.
echo To start the server, run: python app.py
pause
