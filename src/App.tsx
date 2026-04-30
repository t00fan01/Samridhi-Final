import { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, Menu, X, LogOut, Globe } from 'lucide-react';
import FieldInputView from './components/FieldInputView';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export type Urgency = 'High' | 'Medium' | 'Low';

export type Need = {
  id: number;
  location: string;
  needType: string;
  urgency: Urgency;
  description: string;
  timestamp: string;
};

type ViewMode = 'field' | 'coordinator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewMode>('field');
  const [needs, setNeeds] = useState<Need[]>(() => {
    try {
      const saved = localStorage.getItem('samridhi_needs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('samridhi_needs', JSON.stringify(needs));
  }, [needs]);

  const handleAddNeed = (need: Need) => {
    setNeeds(prev => [need, ...prev]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-colors duration-300">
      <nav className="bg-teal-900 border-b border-teal-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 text-white">
              <Globe className="w-8 h-8 text-orange-500" />
              <span className="font-bold text-xl tracking-tight">
                Samridhi
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex space-x-2 bg-teal-950/50 p-1 rounded-lg border border-teal-800/50">
                <button
                  onClick={() => setView('field')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    view === 'field' 
                      ? 'bg-teal-700 text-white shadow-sm' 
                      : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Field Input
                </button>
                <button
                  onClick={() => setView('coordinator')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    view === 'coordinator' 
                      ? 'bg-teal-700 text-white shadow-sm' 
                      : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </button>
              </div>

              <div className="h-6 w-px bg-teal-800 mx-2"></div>

              {auth.currentUser?.displayName && (
                <span className="text-sm font-medium text-teal-100 hidden md:block">
                  Welcome, <span className="text-white font-bold">{auth.currentUser.displayName}</span>
                </span>
              )}

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-teal-100 hover:text-orange-400 transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>

            {/* Mobile Navigation Toggle */}
            <div className="sm:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-teal-100 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-teal-800 bg-teal-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => { setView('field'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  view === 'field' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 mr-3" />
                Field Worker Input
              </button>
              <button
                onClick={() => { setView('coordinator'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  view === 'coordinator' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Coordinator Dashboard
              </button>
              
              <div className="border-t border-teal-800 my-2"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors text-orange-400 hover:bg-teal-800/50 hover:text-orange-300"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col transition-opacity duration-500">
        {view === 'field' ? (
          <FieldInputView onAddNeed={handleAddNeed} onNavigateToDashboard={() => setView('coordinator')} />
        ) : (
          <DashboardView needs={needs} />
        )}
      </main>
    </div>
  );
}
