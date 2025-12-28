"""
AI-Powered Payslip Analyzer
Extracts salary details from PDF/text payslips using advanced pattern matching
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import re
from datetime import datetime
import io

app = Flask(__name__)
CORS(app)

class PayslipAnalyzer:
    def __init__(self):
        self.month_names = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
    
    def extract_text_from_pdf(self, file_bytes):
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text if text.strip() else None
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return None
    
    def extract_company(self, text, lines):
        """Extract company name from payslip"""
        company_keywords = ['ltd', 'limited', 'pvt', 'private', 'inc', 'corp', 
                           'corporation', 'technologies', 'solutions', 'services']
        skip_keywords = ['payslip', 'salary', 'slip', 'pay', 'employee', 
                        'earnings', 'deductions', 'month', 'year']
        
        for line in lines[:15]:
            line_lower = line.lower()
            if any(skip in line_lower for skip in skip_keywords):
                continue
            if any(kw in line_lower for kw in company_keywords):
                if 5 < len(line) < 100:
                    return line.strip()
        
        for line in lines[:5]:
            if 5 < len(line) < 100 and not re.search(r'\d{4}', line):
                return line.strip()
        
        return "Company"
    
    def extract_employee_details(self, text):
        """Extract employee name and ID"""
        name_patterns = [
            r'employee\s*name\s*[:\-]?\s*([a-z\s\.]+)',
            r'name\s*[:\-]\s*([a-z\s\.]+)',
        ]
        id_patterns = [
            r'employee\s*(?:id|code|number)\s*[:\-]?\s*([a-z0-9\-]+)',
            r'emp\s*(?:id|code)\s*[:\-]?\s*([a-z0-9\-]+)',
        ]
        
        name = ""
        emp_id = ""
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip().title()
                break
        
        for pattern in id_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                emp_id = match.group(1).strip().upper()
                break
        
        return name, emp_id
    
    def extract_period(self, text):
        """Extract month and year from payslip"""
        patterns = [
            r'(january|february|march|april|may|june|july|august|september|october|november|december)[,\s]*(\d{4})',
            r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]*(\d{4})',
            r'for\s+(?:the\s+)?month\s+of\s+([a-z]+)[,\s]*(\d{4})',
            r'month\s*[:\-]\s*([a-z]+)[,\s]*(\d{4})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                month_str = match.group(1).lower()[:3]
                year = int(match.group(2))
                month = self.month_names.get(month_str, datetime.now().month)
                return month, year
        
        return datetime.now().month, datetime.now().year
    
    def extract_amount(self, text, patterns):
        """Extract monetary amount using multiple patterns"""
        for pattern in patterns:
            regex_patterns = [
                rf'{pattern}\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([0-9,]+\.?\d*)',
                rf'{pattern}\s+([0-9,]+\.?\d*)',
                rf'{pattern}.*?([0-9,]+\.?\d*)\s*$',
            ]
            
            for regex in regex_patterns:
                matches = list(re.finditer(regex, text, re.IGNORECASE | re.MULTILINE))
                if matches:
                    amount_str = matches[-1].group(1).replace(',', '')
                    try:
                        amount = float(amount_str)
                        if amount > 0:
                            return amount
                    except ValueError:
                        continue
        return 0.0
    
    def extract_all_line_items(self, text):
        """Extract all line items with amounts from payslip"""
        lines = text.split('\n')
        items = []
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            amount_match = re.search(r'([0-9,]+\.?\d*)\s*$', line)
            if amount_match:
                amount_str = amount_match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                    if 10 < amount < 1000000:
                        label = line[:amount_match.start()].strip()
                        label = re.sub(r'[:\-\|]+$', '', label).strip()
                        label = re.sub(r'^(?:rs\.?|₹|inr)\s*', '', label, flags=re.IGNORECASE).strip()
                        
                        if label and len(label) > 2 and not re.match(r'^\d+$', label) and not any(skip in label.lower() for skip in ['generated', 'payslip', 'date', 'time', 'page', 'print', 'slip']):
                            items.append({'label': label, 'amount': amount})
                except ValueError:
                    continue
        
        return items
    
    def analyze(self, file_content, file_type='pdf'):
        """Main analysis function"""
        if file_type == 'pdf':
            text = self.extract_text_from_pdf(file_content)
            if not text:
                raise ValueError("Could not extract text from PDF. File may be encrypted or image-based.")
        else:
            text = file_content.decode('utf-8') if isinstance(file_content, bytes) else file_content
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Insufficient text extracted from file")
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        company = self.extract_company(text, lines)
        employee_name, employee_id = self.extract_employee_details(text)
        month, year = self.extract_period(text)
        
        all_items = self.extract_all_line_items(text)
        
        earning_keywords = [
            'basic', 'salary', 'hra', 'house rent', 'dearness', 'da', 'transport', 
            'conveyance', 'medical', 'special', 'allowance', 'cca', 'city compensatory',
            'lta', 'leave travel', 'education', 'uniform', 'washing', 'overtime', 'ot',
            'shift', 'performance', 'arrear', 'bonus', 'incentive', 'gratuity', 
            'reimbursement', 'food', 'telephone', 'mobile', 'internet', 'vehicle',
            'fuel', 'petrol', 'car', 'driver', 'servant', 'helper', 'children',
            'entertainment', 'newspaper', 'club', 'gift', 'festival', 'variable',
            'fixed', 'gross', 'earning', 'income', 'pay', 'stipend', 'retainer'
        ]
        
        deduction_keywords = [
            'provident', 'pf', 'epf', 'tax', 'tds', 'income tax', 'professional',
            'pt', 'esi', 'insurance', 'loan', 'advance', 'recovery', 'canteen',
            'welfare', 'lwf', 'labour', 'deduction', 'deduct', 'contribution',
            'pension', 'nps', 'vpf', 'society', 'cooperative', 'union', 'fine'
        ]
        
        skip_keywords = [
            'total', 'gross', 'net', 'sum', 'subtotal', 'grand', 'ytd', 
            'year to date', 'cumulative', 'balance', 'paid', 'days', 'month',
            'employee', 'employer', 'contribution', 'payable', 'payment',
            'generated', 'payslip', 'slip', 'date', 'time', 'page', 'print'
        ]
        
        earnings = []
        deductions = []
        processed_labels = set()
        
        for item in all_items:
            label_lower = item['label'].lower()
            
            if any(skip in label_lower for skip in skip_keywords):
                continue
            
            if label_lower in processed_labels:
                continue
            
            is_earning = any(kw in label_lower for kw in earning_keywords)
            is_deduction = any(kw in label_lower for kw in deduction_keywords)
            
            if is_earning and not is_deduction:
                name = item['label'].title()
                name = re.sub(r'\s+', ' ', name).strip()
                earnings.append({'name': name, 'amount': item['amount']})
                processed_labels.add(label_lower)
            elif is_deduction:
                name = item['label'].title()
                name = re.sub(r'\s+', ' ', name).strip()
                deductions.append({'name': name, 'amount': item['amount']})
                processed_labels.add(label_lower)
        
        basic_salary = next((e['amount'] for e in earnings if 'basic' in e['name'].lower()), 0)
        
        gross_salary = sum(e['amount'] for e in earnings)
        total_deductions = sum(d['amount'] for d in deductions)
        net_salary = self.extract_amount(text, [r'net\s*salary', r'net\s*pay', r'take\s*home'])
        
        if net_salary == 0:
            net_salary = gross_salary - total_deductions
        
        return {
            'company': company,
            'month': month,
            'year': year,
            'employeeName': employee_name,
            'employeeId': employee_id,
            'basicSalary': basic_salary,
            'earnings': earnings,
            'deductions': deductions,
            'grossSalary': gross_salary,
            'totalDeductions': total_deductions,
            'netSalary': net_salary,
        }

@app.route('/analyze-payslip', methods=['POST'])
def analyze_payslip():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        file_content = file.read()
        file_type = 'pdf' if file.filename.lower().endswith('.pdf') else 'text'
        
        analyzer = PayslipAnalyzer()
        result = analyzer.analyze(file_content, file_type)
        
        return jsonify({'success': True, 'data': result})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
