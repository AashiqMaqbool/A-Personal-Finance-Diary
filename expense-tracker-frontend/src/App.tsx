import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, Calendar, Receipt, Wallet, Target, 
  TrendingUp, Lightbulb, BarChart3, Menu, X, Banknote, CreditCard 
} from 'lucide-react';
import { useState } from 'react';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import EnhancedExpenses from './pages/EnhancedExpenses';
import EnhancedBudget from './pages/EnhancedBudget';
import Goals from './pages/Goals';
import Portfolio from './pages/Portfolio';
import Insights from './pages/Insights';
import Dashboard from './pages/Dashboard';
import Salary from './pages/Salary';
import EMITracker from './pages/EMITracker';

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Timeline', href: '/timeline', icon: Calendar },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Budget', href: '/budget', icon: Wallet },
    { name: 'Salary', href: '/salary', icon: Banknote },
    { name: 'EMI Tracker', href: '/emi-tracker', icon: CreditCard },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Portfolio', href: '/portfolio', icon: TrendingUp },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Insights', href: '/insights', icon: Lightbulb },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">FinDiary</h1>
                <p className="text-xs text-slate-500">Financial Journal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <p className="text-xs font-semibold text-slate-700 mb-1">Financial Health</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
                <span className="text-xs font-bold text-slate-700">75%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">FinDiary</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/expenses" element={<EnhancedExpenses />} />
            <Route path="/budget" element={<EnhancedBudget />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/emi-tracker" element={<EMITracker />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/analytics" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
