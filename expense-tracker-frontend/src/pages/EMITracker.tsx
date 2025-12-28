import { useState, useEffect } from 'react';
import { Plus, X, CreditCard, Calendar, TrendingDown, CheckCircle, Edit2, Trash2, Eye, XCircle, Calculator, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// Disable number input scroll
const style = document.createElement('style');
style.textContent = `
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
`;
if (!document.head.querySelector('style[data-number-input-style]')) {
  style.setAttribute('data-number-input-style', 'true');
  document.head.appendChild(style);
}

interface EMIPayment {
  month: number;
  year: number;
  isPaid: boolean;
  paidDate?: string;
  actualPaidAmount?: number;
}

interface EMI {
  id: string;
  name: string;
  category: 'Loan' | 'Insurance' | 'Subscription' | 'Credit Card' | 'Other';
  totalAmount: number;
  emiAmount: number;
  emiBillDate: string;
  tenure: number;
  payments: EMIPayment[];
  status: 'Active' | 'Completed' | 'Closed';
  createdAt: string;
  productBoughtDate: string;
  emiProvider: string;
  remarks?: string;
  interestRate: number;
  penaltyRate: number;
}

const STORAGE_KEY = 'emi_tracker_data';
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EMITracker() {
  const [emis, setEmis] = useState<EMI[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState<EMI | null>(null);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);
  const [calcData, setCalcData] = useState({ totalAmount: '', tenure: '', monthlyEMI: '' });
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: 'close' | 'delete'; emiId: string } | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    category: EMI['category'];
    totalAmount: string;
    tenure: string;
    emiBillDate: string;
    productBoughtDate: string;
    emiProvider: string;
    remarks: string;
    interestRate: string;
    penaltyRate: string;
    noCost: boolean;
  }>({
    name: '',
    category: 'Loan',
    totalAmount: '',
    tenure: '',
    emiBillDate: new Date().toISOString().split('T')[0],
    productBoughtDate: new Date().toISOString().split('T')[0],
    emiProvider: '',
    remarks: '',
    interestRate: '0',
    penaltyRate: '0',
    noCost: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setEmis(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load EMI data:', error);
      setEmis([]);
    }
  };

  const saveData = (data: EMI[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEmis(data);
    } catch (error) {
      console.error('Failed to save EMI data:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emiBillDate = new Date(formData.emiBillDate);
    const payments: EMIPayment[] = [];
    const calculatedEMI = parseFloat(formData.totalAmount) / parseInt(formData.tenure);
    
    for (let i = 0; i < parseInt(formData.tenure); i++) {
      const paymentDate = new Date(emiBillDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      payments.push({
        month: paymentDate.getMonth() + 1,
        year: paymentDate.getFullYear(),
        isPaid: false,
      });
    }

    const emi: EMI = {
      id: editingEMI?.id || `emi-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: formData.name,
      category: formData.category,
      totalAmount: parseFloat(formData.totalAmount),
      emiAmount: calculatedEMI,
      emiBillDate: formData.emiBillDate,
      tenure: parseInt(formData.tenure),
      payments: editingEMI?.payments || payments,
      status: editingEMI?.status || 'Active',
      createdAt: editingEMI?.createdAt || new Date().toISOString(),
      productBoughtDate: formData.productBoughtDate,
      emiProvider: formData.emiProvider,
      remarks: formData.remarks || undefined,
      interestRate: formData.noCost ? 0 : (parseFloat(formData.interestRate) || 0),
      penaltyRate: formData.noCost ? 0 : (parseFloat(formData.penaltyRate) || 0),
    };

    saveData(editingEMI ? emis.map(e => e.id === editingEMI.id ? emi : e) : [...emis, emi]);
    resetForm();
  };

  const handleEdit = (emi: EMI) => {
    setEditingEMI(emi);
    setFormData({
      name: emi.name,
      category: emi.category,
      totalAmount: emi.totalAmount.toString(),
      tenure: emi.tenure.toString(),
      emiBillDate: emi.emiBillDate || new Date().toISOString().split('T')[0],
      productBoughtDate: emi.productBoughtDate || new Date().toISOString().split('T')[0],
      emiProvider: emi.emiProvider || '',
      remarks: emi.remarks || '',
      interestRate: (emi.interestRate || 0).toString(),
      penaltyRate: (emi.penaltyRate || 0).toString(),
      noCost: emi.interestRate === 0 && emi.penaltyRate === 0,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setConfirmAction({ show: true, type: 'delete', emiId: id });
  };

  const confirmDelete = () => {
    if (confirmAction) {
      saveData(emis.filter(e => e.id !== confirmAction.emiId));
      setConfirmAction(null);
    }
  };

  const handleTogglePayment = (emiId: string, paymentIndex: number, actualAmount?: number) => {
    const emi = emis.find(e => e.id === emiId);
    if (!emi) return;

    const updatedPayments = [...emi.payments];
    const currentPayment = updatedPayments[paymentIndex];
    const newIsPaid = !currentPayment.isPaid;
    
    updatedPayments[paymentIndex] = {
      ...currentPayment,
      isPaid: newIsPaid,
      paidDate: newIsPaid ? new Date().toISOString() : undefined,
      actualPaidAmount: newIsPaid ? (actualAmount || emi.emiAmount) : undefined,
    };

    const paidCount = updatedPayments.filter(p => p.isPaid).length;
    const updatedEMI: EMI = { 
      ...emi, 
      payments: updatedPayments, 
      status: paidCount >= emi.tenure ? 'Completed' : 'Active' 
    };
    saveData(emis.map(e => e.id === emiId ? updatedEMI : e));
    
    if (selectedEMI && selectedEMI.id === emiId) {
      setSelectedEMI(updatedEMI);
    }
  };

  const handleCloseEMI = (id: string) => {
    setConfirmAction({ show: true, type: 'close', emiId: id });
  };

  const confirmClose = () => {
    if (confirmAction) {
      const emi = emis.find(e => e.id === confirmAction.emiId);
      if (emi) {
        const updatedEMI: EMI = { ...emi, status: 'Closed' };
        saveData(emis.map(e => e.id === confirmAction.emiId ? updatedEMI : e));
        setConfirmAction(null);
      }
    }
  };

  const calculatePenalty = (emi: EMI, paymentIndex: number): number => {
    const payment = emi.payments[paymentIndex];
    if (payment.isPaid) return 0;

    const today = new Date();
    const dueDate = new Date(emi.emiBillDate);
    dueDate.setMonth(dueDate.getMonth() + paymentIndex);

    if (today > dueDate) {
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penaltyAmount = (emi.emiAmount * emi.penaltyRate / 100) * Math.ceil(daysLate / 30);
      return penaltyAmount;
    }
    return 0;
  };

  const calculateEMI = () => {
    if (calcData.monthlyEMI && calcData.tenure) {
      const monthly = parseFloat(calcData.monthlyEMI);
      const tenure = parseInt(calcData.tenure);
      if (monthly > 0 && tenure > 0) {
        const total = monthly * tenure;
        setFormData({ ...formData, totalAmount: total.toString(), tenure: tenure.toString() });
        setShowCalculator(false);
        setCalcData({ totalAmount: '', tenure: '', monthlyEMI: '' });
      }
    } else if (calcData.totalAmount && calcData.tenure) {
      const total = parseFloat(calcData.totalAmount);
      const tenure = parseInt(calcData.tenure);
      if (total > 0 && tenure > 0) {
        setFormData({ ...formData, totalAmount: total.toString(), tenure: tenure.toString() });
        setShowCalculator(false);
        setCalcData({ totalAmount: '', tenure: '', monthlyEMI: '' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Loan',
      totalAmount: '',
      tenure: '',
      emiBillDate: new Date().toISOString().split('T')[0],
      productBoughtDate: new Date().toISOString().split('T')[0],
      emiProvider: '',
      remarks: '',
      interestRate: '0',
      penaltyRate: '0',
      noCost: false,
    });
    setEditingEMI(null);
    setShowModal(false);
  };

  const activeEMIs = emis.filter(e => e.status === 'Active');
  const completedEMIs = emis.filter(e => e.status === 'Completed' || e.status === 'Closed');
  const totalMonthlyEMI = activeEMIs.reduce((sum, e) => sum + e.emiAmount, 0);
  const totalOutstanding = activeEMIs.reduce((sum, e) => {
    const unpaid = (e.payments || []).filter(p => !p.isPaid).length;
    return sum + (e.emiAmount * unpaid);
  }, 0);

  const [editingPayment, setEditingPayment] = useState<{ emiId: string; index: number; amount: string } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">EMI Tracker</h1>
            <p className="text-slate-600 mt-2">Track and manage your monthly EMIs</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">
              <CheckCircle className="w-5 h-5" />
              History
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800">
              <Plus className="w-5 h-5" />
              Add EMI
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">Active EMIs</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeEMIs.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Monthly EMI</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalMonthlyEMI)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-slate-600">Current Outstanding</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalOutstanding)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{completedEMIs.length}</p>
          </div>
        </div>

        {activeEMIs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active EMIs</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeEMIs.map(emi => {
                const paidCount = (emi.payments || []).filter(p => p.isPaid).length;
                const progress = (paidCount / emi.tenure) * 100;
                const remaining = emi.tenure - paidCount;
                const totalPaid = emi.payments.filter(p => p.isPaid).reduce((sum, p) => sum + (p.actualPaidAmount || emi.emiAmount), 0);
                const remainingAmount = remaining * emi.emiAmount;
                return (
                  <div key={emi.id} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{emi.name}</h3>
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-xs rounded-full">{emi.category}</span>
                        </div>
                        <p className="text-xs text-slate-500">{emi.emiProvider}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(emi)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(emi.id)} className="p-1.5 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-xs text-slate-500 mb-0.5">Monthly EMI</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(emi.emiAmount)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                        <p className="text-xs text-green-600 mb-0.5">Paid</p>
                        <p className="text-sm font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                        <p className="text-xs text-orange-600 mb-0.5">Remaining</p>
                        <p className="text-sm font-bold text-orange-700">{formatCurrency(remainingAmount)}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: emi.tenure }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-5 rounded transition-all duration-300 ${
                                  idx < paidCount
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                                style={{ flex: 1 }}
                                title={`EMI ${idx + 1} - ${idx < paidCount ? 'Paid' : 'Pending'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{paidCount}/{emi.tenure}</span>
                        <div className="px-2 py-0.5 bg-green-100 rounded">
                          <span className="text-xs font-bold text-green-700">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedEMI(emi); setShowDetailModal(true); }} className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button onClick={() => handleCloseEMI(emi.id)} className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Close
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {emis.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg text-slate-500">No EMIs tracked yet</p>
            <p className="text-sm text-slate-400 mt-2">Add your first EMI to start tracking</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{editingEMI ? 'Edit EMI' : 'Add New EMI'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">EMI Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="e.g., Home Loan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as EMI['category'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900">
                    <option value="Loan">Loan</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount *</label>
                  <input type="number" required value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (Months) *</label>
                  <input type="number" required value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="12" />
                </div>
              </div>
              {formData.totalAmount && formData.tenure && (
                <div className="bg-slate-100 rounded-lg p-3">
                  <p className="text-sm text-slate-600">Monthly EMI: <span className="font-bold text-slate-900">{formatCurrency(parseFloat(formData.totalAmount) / parseInt(formData.tenure))}</span></p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">EMI Bill Date *</label>
                  <input type="date" required value={formData.emiBillDate} onChange={e => setFormData({ ...formData, emiBillDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Bought Date *</label>
                  <input type="date" required value={formData.productBoughtDate} onChange={e => setFormData({ ...formData, productBoughtDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">EMI Provider *</label>
                <input type="text" required value={formData.emiProvider} onChange={e => setFormData({ ...formData, emiProvider: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="e.g., HDFC Bank" />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.noCost} onChange={e => setFormData({ ...formData, noCost: e.target.checked, interestRate: e.target.checked ? '0' : formData.interestRate, penaltyRate: e.target.checked ? '0' : formData.penaltyRate })} className="w-4 h-4 text-slate-900 rounded focus:ring-2 focus:ring-slate-900" />
                  <span className="text-sm font-medium text-slate-700">No Cost EMI (0% Interest & Penalty)</span>
                </label>
              </div>
              {!formData.noCost && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                    <input type="number" step="0.01" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="8.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Penalty Rate (%)</label>
                    <input type="number" step="0.01" value={formData.penaltyRate} onChange={e => setFormData({ ...formData, penaltyRate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="2" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" rows={2} placeholder="Additional notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCalculator(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
                  <Calculator className="w-4 h-4" />
                  Calculator
                </button>
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editingEMI ? 'Update' : 'Add'} EMI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">EMI Calculator</h2>
              <button onClick={() => setShowCalculator(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
                  <input type="number" value={calcData.totalAmount} onChange={e => setCalcData({ ...calcData, totalAmount: e.target.value, monthlyEMI: '' })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly EMI</label>
                  <input type="number" value={calcData.monthlyEMI} onChange={e => setCalcData({ ...calcData, monthlyEMI: e.target.value, totalAmount: '' })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="8333" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (Months)</label>
                <input type="number" value={calcData.tenure} onChange={e => setCalcData({ ...calcData, tenure: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="12" />
              </div>
              {calcData.totalAmount && calcData.tenure && (
                <div className="bg-slate-100 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Monthly EMI</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(parseFloat(calcData.totalAmount) / parseInt(calcData.tenure))}</p>
                </div>
              )}
              {calcData.monthlyEMI && calcData.tenure && (
                <div className="bg-slate-100 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(parseFloat(calcData.monthlyEMI) * parseInt(calcData.tenure))}</p>
                </div>
              )}
              <button onClick={calculateEMI} disabled={!(calcData.totalAmount || calcData.monthlyEMI) || !calcData.tenure} className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed">Use This</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedEMI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedEMI.name}</h2>
                <p className="text-sm text-slate-600">{selectedEMI.category} • {selectedEMI.emiProvider}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedEMI.totalAmount)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedEMI.emiAmount)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
                  <p className="text-lg font-bold text-slate-900">{selectedEMI.interestRate}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Penalty Rate</p>
                  <p className="text-lg font-bold text-slate-900">{selectedEMI.penaltyRate}%</p>
                </div>
              </div>
              {selectedEMI.remarks && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">{selectedEMI.remarks}</p>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Payment Schedule</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Month</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Base EMI</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Actual Paid</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Penalty</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEMI.payments.map((payment, index) => {
                        const penalty = calculatePenalty(selectedEMI, index);
                        const actualPaid = payment.actualPaidAmount || selectedEMI.emiAmount;
                        const totalAmount = actualPaid + penalty;
                        const isEditing = editingPayment?.emiId === selectedEMI.id && editingPayment?.index === index;
                        return (
                          <tr key={index} className={`border-b border-slate-100 ${payment.isPaid ? 'bg-green-50' : 'bg-white'}`}>
                            <td className="px-4 py-2 text-sm text-slate-900">
                              {months[payment.month - 1]} {payment.year}
                              {payment.paidDate && <div className="text-xs text-slate-500">Paid: {new Date(payment.paidDate).toLocaleDateString()}</div>}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-slate-900">{formatCurrency(selectedEMI.emiAmount)}</td>
                            <td className="px-4 py-2 text-sm text-right">
                              {payment.isPaid ? (
                                isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingPayment.amount}
                                    onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                    onBlur={() => {
                                      const amount = parseFloat(editingPayment.amount);
                                      if (amount > 0) {
                                        const emi = emis.find(e => e.id === selectedEMI.id);
                                        if (emi) {
                                          const updatedPayments = [...emi.payments];
                                          updatedPayments[index] = { ...updatedPayments[index], actualPaidAmount: amount };
                                          const updatedEMI = { ...emi, payments: updatedPayments };
                                          saveData(emis.map(e => e.id === selectedEMI.id ? updatedEMI : e));
                                          setSelectedEMI(updatedEMI);
                                        }
                                      }
                                      setEditingPayment(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        const amount = parseFloat(editingPayment.amount);
                                        if (amount > 0) {
                                          const emi = emis.find(e => e.id === selectedEMI.id);
                                          if (emi) {
                                            const updatedPayments = [...emi.payments];
                                            updatedPayments[index] = { ...updatedPayments[index], actualPaidAmount: amount };
                                            const updatedEMI = { ...emi, payments: updatedPayments };
                                            saveData(emis.map(e => e.id === selectedEMI.id ? updatedEMI : e));
                                            setSelectedEMI(updatedEMI);
                                          }
                                        }
                                        setEditingPayment(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingPayment(null);
                                      }
                                    }}
                                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right focus:ring-2 focus:ring-slate-900"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className="text-green-700 font-semibold cursor-pointer hover:underline"
                                    onClick={() => setEditingPayment({ emiId: selectedEMI.id, index, amount: actualPaid.toString() })}
                                    title="Click to edit"
                                  >
                                    {formatCurrency(actualPaid)}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-red-600">{penalty > 0 ? formatCurrency(penalty) : '-'}</td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900">{payment.isPaid ? formatCurrency(totalAmount) : '-'}</td>
                            <td className="px-4 py-2 text-center">
                              {payment.isPaid ? <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Paid</span> : <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Pending</span>}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => handleTogglePayment(selectedEMI.id, index)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${payment.isPaid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                {payment.isPaid ? '✓ Paid' : 'Mark Paid'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">EMI History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {completedEMIs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg text-slate-500">No completed EMIs yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedEMIs.map(emi => {
                    const paidCount = emi.payments.filter(p => p.isPaid).length;
                    return (
                      <div key={emi.id} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{emi.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${emi.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {emi.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{emi.category} • {emi.emiProvider}</p>
                          </div>
                          <button onClick={() => { setSelectedEMI(emi); setShowDetailModal(true); }} className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Total Amount</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(emi.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Monthly EMI</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(emi.emiAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tenure</p>
                            <p className="font-semibold text-slate-900">{emi.tenure} months</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Paid</p>
                            <p className="font-semibold text-green-600">{paidCount}/{emi.tenure}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Close'}</h2>
            </div>
            <p className="text-slate-600 mb-6">
              {confirmAction.type === 'delete' 
                ? 'Are you sure you want to delete this EMI? This action cannot be undone.' 
                : 'Are you sure you want to close this EMI? It will be moved to history.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
              <button onClick={confirmAction.type === 'delete' ? confirmDelete : confirmClose} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                {confirmAction.type === 'delete' ? 'Delete' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
