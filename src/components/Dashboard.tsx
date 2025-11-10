import { useState, useEffect } from 'react';
import {
  Home, CreditCard, DollarSign, TrendingUp, Shield, FileText,
  Settings, LogOut, Menu, X, Building2, Wallet, Users, AlertTriangle, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AccountsView } from './dashboard/AccountsView';
import { CardsView } from './dashboard/CardsView';
import { LoansView } from './dashboard/LoansView';
import { InvestmentsView } from './dashboard/InvestmentsView';
import { InsurancesView } from './dashboard/InsurancesView';
import { CryptoView } from './dashboard/CryptoView';
import { ATMView } from './dashboard/ATMView';
import { SettingsView } from './dashboard/SettingsView';
import { OverviewView } from './dashboard/OverviewView';
import { UsersManagementView } from './dashboard/UsersManagementView';
import { ApproveLoansView } from './dashboard/ApproveLoansView';
import { AdminPanelView } from './dashboard/AdminPanelView';
import { supabase } from '../lib/supabase';

type View = 'overview' | 'accounts' | 'cards' | 'loans' | 'investments' | 'insurances' |
            'crypto' | 'atm' | 'settings' | 'users' | 'approve-loans' | 'admin';

export const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (profile) {
      loadLoyaltyPoints();
    }
  }, [profile]);

  const loadLoyaltyPoints = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('loyalty_points')
      .select('total_points')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data) {
      setLoyaltyPoints(data.total_points);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userMenuItems = [
    { id: 'overview', label: 'Resumen', icon: Home },
    { id: 'accounts', label: 'Cuentas', icon: Wallet },
    { id: 'cards', label: 'Tarjetas', icon: CreditCard },
    { id: 'loans', label: 'Préstamos', icon: DollarSign },
    { id: 'investments', label: 'Inversiones', icon: TrendingUp },
    { id: 'insurances', label: 'Seguros', icon: Shield },
    { id: 'crypto', label: 'Criptomonedas', icon: TrendingUp },
    { id: 'atm', label: 'Cajeros', icon: Building2 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const workerMenuItems = [
    { id: 'overview', label: 'Resumen', icon: Home },
    { id: 'admin', label: 'Panel de Admin', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cuentas', icon: Wallet },
    { id: 'cards', label: 'Tarjetas', icon: CreditCard },
    { id: 'loans', label: 'Préstamos', icon: DollarSign },
    { id: 'investments', label: 'Inversiones', icon: TrendingUp },
    { id: 'insurances', label: 'Seguros', icon: Shield },
    { id: 'crypto', label: 'Criptomonedas', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const menuItems = profile?.role === 'worker' ? workerMenuItems : userMenuItems;

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView />;
      case 'admin':
        return profile?.role === 'worker' ? <AdminPanelView onNavigate={(view) => setCurrentView(view as View)} /> : null;
      case 'accounts':
        return <AccountsView />;
      case 'cards':
        return <CardsView />;
      case 'loans':
        return <LoansView />;
      case 'investments':
        return <InvestmentsView />;
      case 'insurances':
        return <InsurancesView />;
      case 'crypto':
        return <CryptoView />;
      case 'atm':
        return <ATMView />;
      case 'settings':
        return <SettingsView />;
      case 'users':
        return profile?.role === 'worker' ? <UsersManagementView /> : null;
      case 'approve-loans':
        return profile?.role === 'worker' ? <ApproveLoansView /> : null;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 border-r border-gray-800 min-h-screen overflow-hidden`}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <Building2 className="h-8 w-8 text-emerald-500" />
              <span className="text-xl font-bold text-emerald-500">Banko</span>
            </div>

            <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Puntos de Fidelidad</div>
              <div className="text-2xl font-bold text-emerald-500">{loyaltyPoints}</div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 mt-6 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <h1 className="text-xl font-semibold">
                  {menuItems.find(item => item.id === currentView)?.label}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {profile?.full_name?.replace(/\s*usuario\s*/gi, '').trim()}
                </span>
                {profile?.role === 'worker' && (
                  <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded">
                    Trabajador
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="p-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};
