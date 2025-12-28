import { useState, useEffect } from 'react';
import { Upload, FileText, X, Download, Eye, Trash2, Calendar, Building2, DollarSign, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import CustomAlert from '../components/CustomAlert';

interface AnalyzedPayslip {
  id: string;
  fileName: string;
  uploadDate: string;
  company: string;
  month: number;
  year: number;
  employeeName: string;
  employeeId: string;
  basicSalary: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  rawText: string;
}

const STORAGE_KEY = 'payslip_room_data';

export default function PayslipRoom() {
  const [payslips, setPayslips] = useState<AnalyzedPayslip[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<AnalyzedPayslip | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'confirm'; title: string; message: string; onConfirm?: () => void } | null>(null);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setPayslips(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load payslips:', error);
    }
  };

  const savePayslips = (data: AnalyzedPayslip[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPayslips(data);
    } catch (error) {
      console.error('Failed to save payslips:', error);
    }
  };

  const analyzePayslip = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5000/analyze-payslip', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Analysis failed');
      }
      
      const analyzed = result.data;
      
      const newPayslip: AnalyzedPayslip = {
        id: `payslip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        ...analyzed,
        rawText: '',
      };

      savePayslips([...payslips, newPayslip]);
      setShowUploadModal(false);
      setUploadedFile(null);
      setSelectedPayslip(newPayslip);
      setShowViewModal(true);
    } catch (error: any) {
      console.error('Failed to analyze payslip:', error);
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('Failed to fetch')) {
        setAlert({
          type: 'error',
          title: 'Connection Error',
          message: 'Cannot connect to Python backend.\n\nPlease ensure:\n1. Python server is running (python app.py)\n2. Server is on http://localhost:5000\n3. All dependencies are installed (run install.bat)',
          onConfirm: () => setAlert(null),
        });
      } else {
        setAlert({
          type: 'error',
          title: 'Analysis Failed',
          message: `${errorMsg}\n\nTip: Make sure your PDF is text-based, not a scanned image.`,
          onConfirm: () => setAlert(null),
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleDelete = (id: string) => {
    setAlert({
      type: 'confirm',
      title: 'Delete Payslip',
      message: 'Are you sure you want to delete this payslip?',
      onConfirm: () => {
        savePayslips(payslips.filter(p => p.id !== id));
        setAlert(null);
      },
    });
  };

  const addToSalaryTracker = (payslip: AnalyzedPayslip) => {
    try {
      const salaryData = localStorage.getItem('salary_tracker_data');
      const salaries = salaryData ? JSON.parse(salaryData) : [];
      
      const totalEarnings = payslip.earnings.reduce((sum, e) => sum + e.amount, 0) - payslip.basicSalary;
      const components = payslip.earnings.filter(e => e.name !== 'Basic Salary').map(e => ({
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: e.name,
        amount: e.amount,
        type: 'earning' as const,
      })).concat(payslip.deductions.map(d => ({
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: d.name,
        amount: d.amount,
        type: 'deduction' as const,
      })));
      
      const newSalary = {
        id: `sal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        basicSalary: payslip.basicSalary,
        allowances: totalEarnings,
        bonus: 0,
        deductions: payslip.totalDeductions,
        netSalary: payslip.netSalary,
        company: payslip.company,
        month: payslip.month,
        year: payslip.year,
        date: new Date().toISOString(),
        components,
      };
      
      localStorage.setItem('salary_tracker_data', JSON.stringify([...salaries, newSalary]));
      setAlert({
        type: 'success',
        title: 'Success',
        message: '✓ Added to Salary Tracker successfully!',
        onConfirm: () => setAlert(null),
      });
    } catch (error) {
      console.error('Failed to add to salary tracker:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add to Salary Tracker',
        onConfirm: () => setAlert(null),
      });
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Payslip Room</h1>
            <p className="text-slate-600 mt-2">AI-powered payslip analysis and storage</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Payslip
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600">Total Payslips</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{payslips.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600">Latest Salary</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {payslips.length > 0 ? formatCurrency(payslips[payslips.length - 1].netSalary) : '₹0'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600">Companies</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {new Set(payslips.map(p => p.company)).size}
            </p>
          </div>
        </div>

        {/* Payslips Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Analyzed Payslips</h2>
          </div>
          {payslips.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg">No payslips uploaded yet</p>
              <p className="text-sm mt-2">Upload your first payslip to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {[...payslips].reverse().map(payslip => (
                <div key={payslip.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{payslip.company}</p>
                        <p className="text-xs text-slate-500">{months[payslip.month - 1]} {payslip.year}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Gross</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(payslip.grossSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Deductions</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(payslip.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-slate-900 font-semibold">Net Salary</span>
                      <span className="font-bold text-slate-900">{formatCurrency(payslip.netSalary)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedPayslip(payslip); setShowViewModal(true); }}
                      className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(payslip.id)}
                      className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Upload Payslip</h2>
                  <p className="text-sm text-slate-500 mt-1">AI will analyze and store it</p>
                </div>
                <button onClick={() => { setShowUploadModal(false); setUploadedFile(null); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    id="payslip-upload"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="payslip-upload" className="cursor-pointer">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900 mb-2">
                      {uploadedFile ? uploadedFile.name : 'Click to upload'}
                    </p>
                    <p className="text-sm text-slate-500">TXT, PDF, DOC, DOCX</p>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowUploadModal(false); setUploadedFile(null); }}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => uploadedFile && analyzePayslip(uploadedFile)}
                    disabled={!uploadedFile || isAnalyzing}
                    className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedPayslip && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Payslip Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Company & Period */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPayslip.company}</h3>
                <p className="text-slate-600">
                  {months[selectedPayslip.month - 1]} {selectedPayslip.year}
                  {selectedPayslip.employeeName && ` • ${selectedPayslip.employeeName}`}
                  {selectedPayslip.employeeId && ` (${selectedPayslip.employeeId})`}
                </p>
              </div>

              {/* Earnings */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Earnings</h4>
                <div className="space-y-2">
                  {selectedPayslip.earnings.map((earning, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">{earning.name}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(earning.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-semibold">
                    <span className="text-slate-900">Gross Salary</span>
                    <span className="text-slate-900">{formatCurrency(selectedPayslip.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Deductions</h4>
                <div className="space-y-2">
                  {selectedPayslip.deductions.map((deduction, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">{deduction.name}</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-semibold">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-red-600">-{formatCurrency(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-slate-900 text-white rounded-xl p-6">
                <p className="text-sm mb-1">Net Salary</p>
                <p className="text-4xl font-bold">{formatCurrency(selectedPayslip.netSalary)}</p>
              </div>

              {/* Add to Salary Tracker Button */}
              <button
                onClick={() => { addToSalaryTracker(selectedPayslip); setShowViewModal(false); }}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Salary Tracker
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Alert */}
      {alert && (
        <CustomAlert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={alert.onConfirm || (() => setAlert(null))}
          onCancel={() => setAlert(null)}
        />
      )}
    </div>
  );
}
