import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, Calendar, Receipt, Wallet, Target, 
  TrendingUp, Lightbulb, BarChart3, Menu, X, Banknote, CreditCard, LogOut, User, DollarSign 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import EnhancedExpenses from './pages/EnhancedExpenses';
import EnhancedBudget from './pages/EnhancedBudget';
import Goals from './pages/Goals';
import GoalAchievements from './pages/GoalAchievements';
import Portfolio from './pages/Portfolio';
import Insights from './pages/Insights';
import Dashboard from './pages/Dashboard';
import Salary from './pages/Salary';
import EMITracker from './pages/EMITracker';
import Incomes from './pages/Incomes';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WelcomeToast from './components/WelcomeToast';
import { isAuthenticated, logout, getCurrentUser } from './utils/auth';
import { migrateDataToUser } from './utils/userStorage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user) {
        migrateDataToUser(user.email);
        
        // Check if this is a fresh login (show welcome)
        const welcomeShown = sessionStorage.getItem('welcome_shown');
        if (!welcomeShown) {
          setShowWelcome(true);
          sessionStorage.setItem('welcome_shown', 'true');
        }
      }
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      {showWelcome && getCurrentUser() && (
        <WelcomeToast
          message="Your personalized financial dashboard is ready!"
          userName={getCurrentUser()!.name}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Timeline', href: '/timeline', icon: Calendar },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Income', href: '/income', icon: DollarSign },
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
            <div className="px-4 py-3 bg-slate-50 rounded-xl mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{getCurrentUser()?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{getCurrentUser()?.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('welcome_shown');
                logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
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
            <Route path="/income" element={<Incomes />} />
            <Route path="/budget" element={<EnhancedBudget />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/emi-tracker" element={<EMITracker />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/achievements" element={<GoalAchievements />} />
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
