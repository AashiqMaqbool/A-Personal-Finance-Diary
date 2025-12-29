import { useState, useEffect } from 'react';
import { Plus, X, DollarSign, TrendingUp, PieChart, Calendar, Briefcase, Edit2, Trash2, Sparkles, Upload, FileText, Eye, Building2, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import CustomAlert from '../components/CustomAlert';
import { getUserData, setUserData } from '../utils/userStorage';

interface SalaryEntry {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  company: string;
  date: string;
  components?: SalaryComponent[];
}

interface SalaryComponent {
  id: string;
  name: string;
  amount: number;
  type: 'earning' | 'deduction';
}

interface CompanyTemplate {
  company: string;
  components: Omit<SalaryComponent, 'id' | 'amount'>[];
}

const STORAGE_KEY = 'salary_tracker_data';
const TEMPLATES_KEY = 'salary_company_templates';
const PAYSLIP_STORAGE_KEY = 'payslip_room_data';

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
  addedToTracker?: boolean;
}

export default function Salary() {
  const [salaries, setSalaries] = useState<SalaryEntry[]>([]);
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
  const [payslips, setPayslips] = useState<AnalyzedPayslip[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showFinancialAdvisor, setShowFinancialAdvisor] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPayslipRoom, setShowPayslipRoom] = useState(false);
  const [showPayslipView, setShowPayslipView] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<AnalyzedPayslip | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advisorStep, setAdvisorStep] = useState(1);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'confirm'; title: string; message: string; onConfirm?: () => void } | null>(null);
  const [userPreferences, setUserPreferences] = useState({
    riskLevel: 'moderate',
    investmentGoal: 'wealth',
    savingsPercentage: 30,
  });
  const [editingEntry, setEditingEntry] = useState<SalaryEntry | null>(null);
  const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('simple');
  const [formData, setFormData] = useState({
    basicSalary: '',
    allowances: '',
    bonus: '',
    deductions: '',
    company: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalSalary: '',
  });
  const [customComponents, setCustomComponents] = useState<SalaryComponent[]>([]);

  useEffect(() => {
    loadData();
    loadTemplates();
    loadPayslips();
  }, []);

  const loadData = () => {
    setSalaries(getUserData<SalaryEntry[]>(STORAGE_KEY, []));
  };

  const loadTemplates = () => {
    setCompanyTemplates(getUserData<CompanyTemplate[]>(TEMPLATES_KEY, []));
  };

  const loadPayslips = () => {
    setPayslips(getUserData<AnalyzedPayslip[]>(PAYSLIP_STORAGE_KEY, []));
  };

  const savePayslips = (data: AnalyzedPayslip[]) => {
    setUserData(PAYSLIP_STORAGE_KEY, data);
    setPayslips(data);
  };

  const saveTemplates = (templates: CompanyTemplate[]) => {
    setUserData(TEMPLATES_KEY, templates);
    setCompanyTemplates(templates);
  };

  const saveData = (data: SalaryEntry[]) => {
    setUserData(STORAGE_KEY, data);
    setSalaries(data);
  };

  const handleCompanyChange = (company: string) => {
    setFormData({ ...formData, company });
    const template = companyTemplates.find(t => t.company.toLowerCase() === company.toLowerCase());
    if (template && template.components.length > 0) {
      const components = template.components.map(c => ({
        ...c,
        id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        amount: 0,
      }));
      setCustomComponents(components);
    }
  };

  const addCustomComponent = (type: 'earning' | 'deduction') => {
    const newComponent: SalaryComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: '',
      amount: 0,
      type,
    };
    setCustomComponents([...customComponents, newComponent]);
  };

  const updateComponent = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCustomComponents(customComponents.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeComponent = (id: string) => {
    setCustomComponents(customComponents.filter(c => c.id !== id));
  };

  const saveCompanyTemplate = (company: string, components: SalaryComponent[]) => {
    if (!company || components.length === 0) return;
    const template: CompanyTemplate = {
      company,
      components: components.map(({ name, type }) => ({ name, type })),
    };
    const existing = companyTemplates.filter(t => t.company.toLowerCase() !== company.toLowerCase());
    saveTemplates([...existing, template]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let basic, allowances, bonus, deductions, netSalary;
    if (entryMode === 'simple') {
      netSalary = parseFloat(formData.totalSalary);
      basic = netSalary;
      allowances = 0;
      bonus = 0;
      deductions = 0;
    } else {
      basic = parseFloat(formData.basicSalary);
      const earnings = customComponents.filter(c => c.type === 'earning').reduce((sum, c) => sum + (c.amount || 0), 0);
      const deducts = customComponents.filter(c => c.type === 'deduction').reduce((sum, c) => sum + (c.amount || 0), 0);
      allowances = parseFloat(formData.allowances) || 0;
      bonus = parseFloat(formData.bonus) || 0;
      deductions = (parseFloat(formData.deductions) || 0) + deducts;
      netSalary = basic + allowances + bonus + earnings - deductions;
      if (customComponents.length > 0) {
        saveCompanyTemplate(formData.company, customComponents);
      }
    }
    if (editingEntry) {
      const updated = salaries.map(s => 
        s.id === editingEntry.id 
          ? { ...s, basicSalary: basic, allowances, bonus, deductions, netSalary, company: formData.company, month: formData.month, year: formData.year, date: new Date().toISOString(), components: customComponents }
          : s
      );
      saveData(updated);
    } else {
      const newEntry: SalaryEntry = {
        id: `sal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        basicSalary: basic,
        allowances,
        bonus,
        deductions,
        netSalary,
        company: formData.company,
        month: formData.month,
        year: formData.year,
        date: new Date().toISOString(),
        components: customComponents,
      };
      saveData([...salaries, newEntry]);
    }
    resetForm();
  };

  const handleEdit = (entry: SalaryEntry) => {
    setEditingEntry(entry);
    const hasBreakup = entry.allowances > 0 || entry.bonus > 0 || entry.deductions > 0 || (entry.components && entry.components.length > 0);
    setEntryMode(hasBreakup ? 'detailed' : 'simple');
    setFormData({
      basicSalary: entry.basicSalary.toString(),
      allowances: entry.allowances.toString(),
      bonus: entry.bonus.toString(),
      deductions: entry.deductions.toString(),
      company: entry.company,
      month: entry.month,
      year: entry.year,
      totalSalary: entry.netSalary.toString(),
    });
    setCustomComponents(entry.components || []);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setAlert({
      type: 'confirm',
      title: 'Delete Salary Entry',
      message: 'Are you sure you want to delete this salary entry?',
      onConfirm: () => {
        saveData(salaries.filter(s => s.id !== id));
        setAlert(null);
      },
    });
  };

  const handleDeletePayslip = (id: string) => {
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

  const resetForm = () => {
    setFormData({
      basicSalary: '',
      allowances: '',
      bonus: '',
      deductions: '',
      company: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalSalary: '',
    });
    setCustomComponents([]);
    setEditingEntry(null);
    setEntryMode('simple');
    setShowModal(false);
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
      
      // Check for duplicate payslip
      const isDuplicate = payslips.some(p => {
        const companyMatch = p.company.toLowerCase() === analyzed.company.toLowerCase();
        const periodMatch = p.month === analyzed.month && p.year === analyzed.year;
        const amountMatch = Math.abs(p.netSalary - analyzed.netSalary) < 10;
        return companyMatch && periodMatch && amountMatch;
      });

      if (isDuplicate) {
        setAlert({
          type: 'error',
          title: 'Duplicate Payslip',
          message: 'This payslip already exists in your records.\n\nA matching payslip for the same company, period, and amount was found.',
          onConfirm: () => setAlert(null),
        });
        setShowUploadModal(false);
        setUploadedFile(null);
        return;
      }
      
      const newPayslip: AnalyzedPayslip = {
        id: `payslip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        ...analyzed,
      };

      savePayslips([...payslips, newPayslip]);
      setShowUploadModal(false);
      setUploadedFile(null);
      setSelectedPayslip(newPayslip);
      setShowPayslipView(true);
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

  const addToSalaryTracker = (payslip: AnalyzedPayslip) => {
    try {
      // Duplicate detection
      const isDuplicate = salaries.some(s => {
        const companyMatch = s.company.toLowerCase() === payslip.company.toLowerCase();
        const periodMatch = s.month === payslip.month && s.year === payslip.year;
        const amountMatch = Math.abs(s.netSalary - payslip.netSalary) < 10;
        return companyMatch && periodMatch && amountMatch;
      });

      if (isDuplicate || payslip.addedToTracker) {
        setAlert({
          type: 'error',
          title: 'Duplicate Detected',
          message: 'This payslip has already been added to Salary Tracker.\n\nA matching entry for the same company, period, and amount already exists.',
          onConfirm: () => setAlert(null),
        });
        return;
      }

      const totalEarnings = payslip.earnings.reduce((sum, e) => sum + e.amount, 0) - payslip.basicSalary;
      
      const earningComponents: SalaryComponent[] = payslip.earnings
        .filter(e => e.name !== 'Basic Salary')
        .map(e => ({
          id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: e.name,
          amount: e.amount,
          type: 'earning' as const,
        }));
      
      const deductionComponents: SalaryComponent[] = payslip.deductions.map(d => ({
        id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: d.name,
        amount: d.amount,
        type: 'deduction' as const,
      }));
      
      const components = [...earningComponents, ...deductionComponents];
      
      const newSalary = {
        id: `sal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
      
      saveData([...salaries, newSalary]);
      
      // Mark payslip as added
      const updatedPayslips = payslips.map(p => 
        p.id === payslip.id ? { ...p, addedToTracker: true } : p
      );
      savePayslips(updatedPayslips);
      
      setShowPayslipView(false);
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



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAnalyzePayslip = () => {
    if (uploadedFile) {
      analyzePayslip(uploadedFile);
    }
  };

  const totalEarnings = salaries.reduce((sum, s) => sum + s.netSalary, 0);
  const avgSalary = salaries.length > 0 ? totalEarnings / salaries.length : 0;
  const latestSalary = salaries.length > 0 ? salaries[salaries.length - 1].netSalary : 0;
  const totalDeductions = salaries.reduce((sum, s) => sum + s.deductions, 0);

const generateFinancialPlan = () => {
    const expensesData = localStorage.getItem('expense_tracker_expenses');
    const budgetsData = localStorage.getItem('expense_tracker_budgets');
    
    const expenses = expensesData ? JSON.parse(expensesData) : [];
    const budgets = budgetsData ? JSON.parse(budgetsData) : [];
    
    // Calculate last 6 months spending, excluding anomalies
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const last6MonthsExpenses = expenses.filter((e: any) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= sixMonthsAgo;
    });
    
    // Group by month and filter out anomalies (months with 0 or <1000 expenses)
    const monthlyTotals: { [key: string]: number } = {};
    last6MonthsExpenses.forEach((e: any) => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + e.amount;
    });
    
    const validMonths = Object.values(monthlyTotals).filter(total => total >= 1000);
    const totalExpenses = validMonths.reduce((sum, total) => sum + total, 0);
    const monthsCount = validMonths.length > 0 ? validMonths.length : 1;
    const avgExpense = totalExpenses / monthsCount;
    
    const monthlyIncome = avgSalary;
    const currentSavings = monthlyIncome - avgExpense;
    const savingsRate = monthlyIncome > 0 ? (currentSavings / monthlyIncome) * 100 : 0;
    
    const investableAmount = monthlyIncome * (userPreferences.savingsPercentage / 100);
    
    let portfolio = [];
    if (userPreferences.riskLevel === 'conservative') {
      portfolio = [
        { name: 'Emergency Fund', allocation: 30, amount: investableAmount * 0.30, icon: '🏦', description: 'Keep money safe and accessible' },
        { name: 'Bank Fixed Deposit', allocation: 30, amount: investableAmount * 0.30, icon: '💰', description: 'Guaranteed returns' },
        { name: 'Gold', allocation: 20, amount: investableAmount * 0.20, icon: '🪙', description: 'Protect against inflation' },
        { name: 'Debt Funds', allocation: 20, amount: investableAmount * 0.20, icon: '📊', description: 'Stable income' },
      ];
    } else if (userPreferences.riskLevel === 'moderate') {
      portfolio = [
        { name: 'Emergency Fund', allocation: 20, amount: investableAmount * 0.20, icon: '🏦', description: 'Safety net for emergencies' },
        { name: 'Sharia SIP', allocation: 30, amount: investableAmount * 0.30, icon: '📈', description: 'Ethical stock investments' },
        { name: 'Gold & Silver', allocation: 15, amount: investableAmount * 0.15, icon: '🪙', description: 'Precious metals' },
        { name: 'Fixed Deposit', allocation: 20, amount: investableAmount * 0.20, icon: '💰', description: 'Safe returns' },
        { name: 'Index Funds', allocation: 15, amount: investableAmount * 0.15, icon: '📊', description: 'Market growth' },
      ];
    } else {
      portfolio = [
        { name: 'Emergency Fund', allocation: 15, amount: investableAmount * 0.15, icon: '🏦', description: 'Basic safety' },
        { name: 'Sharia SIP', allocation: 40, amount: investableAmount * 0.40, icon: '📈', description: 'High growth potential' },
        { name: 'Index Funds', allocation: 25, amount: investableAmount * 0.25, icon: '📊', description: 'Market returns' },
        { name: 'Gold', allocation: 10, amount: investableAmount * 0.10, icon: '🪙', description: 'Hedge' },
        { name: 'Debt Funds', allocation: 10, amount: investableAmount * 0.10, icon: '💼', description: 'Balance' },
      ];
    }
    
    const essentialsAmount = avgExpense;
    const savingsAmount = investableAmount;
    const remainingAmount = monthlyIncome - essentialsAmount - savingsAmount;
    
    // Calculate category expenses excluding fixed costs
    const categoryExpenses: any = {};
    const fixedCategories = ['Housing', 'Insurance', 'Rent'];
    last6MonthsExpenses.forEach((e: any) => {
      const category = e.category;
      if (!fixedCategories.includes(category) && !category.toLowerCase().includes('rent') && !category.toLowerCase().includes('housing')) {
        categoryExpenses[category] = (categoryExpenses[category] || 0) + e.amount;
      }
    });
    
    const topExpenses = Object.entries(categoryExpenses)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([category, amount]: any) => ({
        category,
        current: amount / monthsCount,
        recommended: (amount / monthsCount) * 0.85,
        savings: (amount / monthsCount) * 0.15,
      }));
    
    return {
      monthlyIncome,
      currentSavings,
      savingsRate,
      investableAmount,
      portfolio,
      essentialsAmount,
      savingsAmount,
      remainingAmount,
      topExpenses,
      avgExpense,
    };
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Salary Tracker</h1>
            <p className="text-slate-600 mt-2">Track your income and analyze salary trends</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPayslipRoom(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">
              <FileText className="w-5 h-5" />
              Payslip Room
            </button>
            <button onClick={() => setShowFinancialAdvisor(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Sparkles className="w-5 h-5" />
              Financial Advisor
            </button>
            <button onClick={() => { setEditingEntry(null); setShowModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Plus className="w-5 h-5" />
              Add Salary
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">Total Earnings</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</p>
            <p className="text-sm text-slate-500 mt-1">{salaries.length} entries</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Average Salary</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(avgSalary)}</p>
            <p className="text-sm text-slate-500 mt-1">Per month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Latest Salary</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(latestSalary)}</p>
            <p className="text-sm text-slate-500 mt-1">Most recent</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">Total Deductions</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalDeductions)}</p>
            <p className="text-sm text-slate-500 mt-1">All time</p>
          </div>
        </div>

        {/* Salary Entries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Salary History</h2>
          </div>
          {salaries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg">No salary entries yet</p>
              <p className="text-sm mt-2">Add your first salary entry to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Period</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Company</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Basic</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Allowances</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Bonus</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Deductions</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Net Salary</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...salaries].reverse().map(salary => (
                    <tr key={salary.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-900 font-medium">{months[salary.month - 1]} {salary.year}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{salary.company}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right">{formatCurrency(salary.basicSalary)}</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">{formatCurrency(salary.allowances)}</td>
                      <td className="py-3 px-4 text-sm text-blue-600 text-right">{formatCurrency(salary.bonus)}</td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right">{formatCurrency(salary.deductions)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">{formatCurrency(salary.netSalary)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(salary)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(salary.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{editingEntry ? 'Edit Salary' : 'Add Salary'}</h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="mb-6 flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEntryMode('simple')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    entryMode === 'simple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Simple Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('detailed')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    entryMode === 'detailed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Detailed Breakup
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                    <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                    <input type="number" required value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <input type="text" required value={formData.company} onChange={(e) => handleCompanyChange(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Company name" list="companies" />
                  <datalist id="companies">
                    {companyTemplates.map(t => <option key={t.company} value={t.company} />)}
                  </datalist>
                </div>

                {entryMode === 'simple' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Salary (Net)</label>
                    <input type="number" step="0.01" required value={formData.totalSalary} onChange={(e) => setFormData({ ...formData, totalSalary: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                    <p className="text-xs text-slate-500 mt-1">Enter your total take-home salary</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Basic Salary</label>
                      <input type="number" step="0.01" required value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Allowances</label>
                        <input type="number" step="0.01" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bonus</label>
                        <input type="number" step="0.01" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Deductions</label>
                        <input type="number" step="0.01" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                      </div>
                    </div>
                    {customComponents.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Additional Components</p>
                        {customComponents.map(comp => (
                          <div key={comp.id} className="flex gap-2 items-center">
                            <input type="text" value={comp.name} onChange={(e) => updateComponent(comp.id, 'name', e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Component name" />
                            <input type="number" step="0.01" value={comp.amount} onChange={(e) => updateComponent(comp.id, 'amount', parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="0.00" />
                            <span className={`px-3 py-2 rounded-lg text-xs font-medium ${comp.type === 'earning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{comp.type === 'earning' ? '+' : '-'}</span>
                            <button type="button" onClick={() => removeComponent(comp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => addCustomComponent('earning')} className="flex-1 py-2 px-4 border-2 border-dashed border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium">+ Add Earning</button>
                      <button type="button" onClick={() => addCustomComponent('deduction')} className="flex-1 py-2 px-4 border-2 border-dashed border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium">+ Add Deduction</button>
                    </div>
                    {formData.basicSalary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-1">Net Salary</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(
                            (parseFloat(formData.basicSalary) || 0) +
                            (parseFloat(formData.allowances) || 0) +
                            (parseFloat(formData.bonus) || 0) +
                            customComponents.filter(c => c.type === 'earning').reduce((sum, c) => sum + (c.amount || 0), 0) -
                            (parseFloat(formData.deductions) || 0) -
                            customComponents.filter(c => c.type === 'deduction').reduce((sum, c) => sum + (c.amount || 0), 0)
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editingEntry ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Payslip Modal */}
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

        {/* Financial Advisor Modal */}
        {showFinancialAdvisor && salaries.length > 0 && (() => {
          const plan = generateFinancialPlan();
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">🧠 Your Money Plan</h2>
                    <p className="text-sm text-slate-500">Simple steps to grow your wealth</p>
                  </div>
                  <button onClick={() => { setShowFinancialAdvisor(false); setAdvisorStep(1); }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2, 3].map(step => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${advisorStep >= step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {step}
                      </div>
                      {step < 3 && <div className={`w-16 h-1 ${advisorStep > step ? 'bg-slate-900' : 'bg-slate-200'}`} />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Your Money Snapshot */}
                {advisorStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">💸 Your Money Snapshot</h3>
                      <p className="text-slate-600">Let's see where your money goes each month</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">You Earn</p>
                        <p className="text-3xl font-bold text-slate-900">{formatCurrency(plan.monthlyIncome)}</p>
                        <p className="text-xs text-slate-500 mt-1">per month</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">You Spend</p>
                        <p className="text-3xl font-bold text-slate-900">{formatCurrency(plan.avgExpense)}</p>
                        <p className="text-xs text-slate-500 mt-1">per month</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-slate-600">You're Currently Saving</p>
                          <p className="text-3xl font-bold text-slate-900">{formatCurrency(plan.currentSavings)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-slate-900">{plan.savingsRate.toFixed(0)}%</p>
                          <p className="text-xs text-slate-600">of income</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div className="bg-slate-900 h-3 rounded-full" style={{ width: `${Math.min(100, plan.savingsRate)}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4">
                      <p className="text-sm text-slate-700">
                        💡 <strong>Good to know:</strong> Financial experts recommend saving at least 20-30% of your income. You're at {plan.savingsRate.toFixed(0)}%!
                      </p>
                    </div>

                    <button onClick={() => setAdvisorStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
                      Next: Set Your Goals →
                    </button>
                  </div>
                )}

                {/* Step 2: Set Preferences */}
                {advisorStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">🎯 Set Your Goals</h3>
                      <p className="text-slate-600">Tell us what matters to you</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">How much do you want to save each month?</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="10"
                          max="50"
                          value={userPreferences.savingsPercentage}
                          onChange={(e) => setUserPreferences({ ...userPreferences, savingsPercentage: Number(e.target.value) })}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right min-w-[120px]">
                          <p className="text-2xl font-bold text-slate-900">{userPreferences.savingsPercentage}%</p>
                          <p className="text-sm text-slate-600">{formatCurrency(plan.monthlyIncome * (userPreferences.savingsPercentage / 100))}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">How do you feel about risk?</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'conservative', label: 'Play Safe', icon: '🛡️', desc: 'Protect my money' },
                          { value: 'moderate', label: 'Balanced', icon: '⚖️', desc: 'Mix of safety & growth' },
                          { value: 'aggressive', label: 'Go Bold', icon: '🚀', desc: 'Maximum growth' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setUserPreferences({ ...userPreferences, riskLevel: option.value })}
                            className={`p-4 rounded-xl border-2 transition-all ${userPreferences.riskLevel === option.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <p className="text-2xl mb-1">{option.icon}</p>
                            <p className="font-semibold text-slate-900 text-sm">{option.label}</p>
                            <p className="text-xs text-slate-600 mt-1">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setAdvisorStep(1)} className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">
                        ← Back
                      </button>
                      <button onClick={() => setAdvisorStep(3)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
                        See My Plan →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Your Personalized Plan */}
                {advisorStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">✨ Your Personalized Plan</h3>
                      <p className="text-slate-600">Here's how to grow your wealth</p>
                    </div>

                    {/* Simple Budget Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-4">💰 Your Monthly Budget</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏠</span>
                            <div>
                              <p className="font-semibold text-slate-900">Monthly Expenses</p>
                              <p className="text-xs text-slate-600">Rent, food, bills, transport</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(plan.essentialsAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💸</span>
                            <div>
                              <p className="font-semibold text-slate-900">Savings & Investments</p>
                              <p className="text-xs text-slate-600">Build your wealth</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(plan.savingsAmount)}</p>
                        </div>
                        {plan.remainingAmount > 0 && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💰</span>
                              <div>
                                <p className="font-semibold text-slate-900">Buffer Amount</p>
                                <p className="text-xs text-slate-600">Extra cushion for flexibility</p>
                              </div>
                            </div>
                            <p className="text-lg font-bold text-slate-900">{formatCurrency(plan.remainingAmount)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Investment Portfolio */}
                    <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-4">📈 Where to Invest Your {formatCurrency(plan.investableAmount)}</h4>
                      <div className="space-y-3">
                        {plan.portfolio.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                  <p className="font-semibold text-slate-900">{item.name}</p>
                                  <p className="text-xs text-slate-600">{item.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                                <p className="text-xs text-slate-600">{item.allocation}%</p>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-slate-900 h-2 rounded-full" style={{ width: `${item.allocation}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Wins */}
                    {plan.topExpenses.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-4">🎯 Quick Wins: Save More Money</h4>
                        <div className="space-y-3">
                          {plan.topExpenses.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{item.category}</p>
                                  <p className="text-sm text-slate-600">Reduce by 15% → Save {formatCurrency(item.savings)}/month</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">+{formatCurrency(item.savings)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setAdvisorStep(2)} className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">
                        ← Adjust Settings
                      </button>
                      <button onClick={() => { setShowFinancialAdvisor(false); setAdvisorStep(1); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
                        ✓ Got It!
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Payslip Room Modal */}
        {showPayslipRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Payslip Room</h2>
                  <p className="text-sm text-slate-500 mt-1">AI-powered payslip analysis and storage</p>
                </div>
                <button onClick={() => setShowPayslipRoom(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <p className="text-sm text-slate-600">Total Payslips</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{payslips.length}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-slate-600" />
                    <p className="text-sm text-slate-600">Latest Salary</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {payslips.length > 0 ? formatCurrency(payslips[payslips.length - 1].netSalary) : '₹0'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-slate-600" />
                    <p className="text-sm text-slate-600">Companies</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Set(payslips.map(p => p.company)).size}
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={() => { setShowPayslipRoom(false); setShowUploadModal(true); }}
                className="w-full mb-6 py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold"
              >
                <Upload className="w-5 h-5" />
                Upload New Payslip
              </button>

              {/* Payslips Grid */}
              {payslips.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg">No payslips uploaded yet</p>
                  <p className="text-sm mt-2">Upload your first payslip to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          onClick={() => { setSelectedPayslip(payslip); setShowPayslipView(true); }}
                          className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeletePayslip(payslip.id)}
                          className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {payslip.addedToTracker && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Added to Tracker
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payslip View Modal */}
        {showPayslipView && selectedPayslip && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Payslip Details</h2>
                <button onClick={() => setShowPayslipView(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPayslip.company}</h3>
                <p className="text-slate-600">
                  {months[selectedPayslip.month - 1]} {selectedPayslip.year}
                  {selectedPayslip.employeeName && ` • ${selectedPayslip.employeeName}`}
                  {selectedPayslip.employeeId && ` (${selectedPayslip.employeeId})`}
                </p>
              </div>

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

              <div className="bg-slate-900 text-white rounded-xl p-6 mb-4">
                <p className="text-sm mb-1">Net Salary</p>
                <p className="text-4xl font-bold">{formatCurrency(selectedPayslip.netSalary)}</p>
              </div>

              <button
                onClick={() => addToSalaryTracker(selectedPayslip)}
                disabled={selectedPayslip.addedToTracker}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  selectedPayslip.addedToTracker 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {selectedPayslip.addedToTracker ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Already Added to Salary Tracker
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add to Salary Tracker
                  </>
                )}
              </button>
            </div>
          </div>
        )}

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
    </div>
  );
}
