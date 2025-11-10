import { useEffect, useState } from 'react';
import { Users, CreditCard, DollarSign, Shield, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SystemStats {
  totalUsers: number;
  totalAccounts: number;
  totalCards: number;
  totalLoans: number;
  totalInsurances: number;
  totalInvestments: number;
  pendingLoans: number;
  totalBalance: number;
}

export const AdminPanelView = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAccounts: 0,
    totalCards: 0,
    totalLoans: 0,
    totalInsurances: 0,
    totalInvestments: 0,
    pendingLoans: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'worker') {
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    try {
      const [usersRes, accountsRes, cardsRes, loansRes, insurancesRes, investmentsRes] = await Promise.all([
        supabase.from('users_profile').select('id', { count: 'exact', head: true }),
        supabase.from('accounts').select('balance', { count: 'exact' }),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
        supabase.from('loans').select('status', { count: 'exact' }),
        supabase.from('insurances').select('id', { count: 'exact', head: true }),
        supabase.from('investments').select('id', { count: 'exact', head: true }),
      ]);

      const totalBalance = accountsRes.data?.reduce((sum, acc) => sum + Number(acc.balance || 0), 0) || 0;
      const pendingLoans = loansRes.data?.filter(loan => loan.status === 'pending').length || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalAccounts: accountsRes.count || 0,
        totalCards: cardsRes.count || 0,
        totalLoans: loansRes.count || 0,
        totalInsurances: insurancesRes.count || 0,
        totalInvestments: investmentsRes.count || 0,
        pendingLoans,
        totalBalance,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'worker') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">No tienes permisos para acceder a esta sección</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Administración</h2>
        <p className="text-gray-400 mt-1">Vista general del sistema bancario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-blue-300" />
            <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
          </div>
          <div className="text-blue-200 font-medium">Usuarios Totales</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 border border-emerald-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-emerald-300" />
            <span className="text-3xl font-bold text-white">{stats.totalAccounts}</span>
          </div>
          <div className="text-emerald-200 font-medium">Cuentas Activas</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="h-8 w-8 text-purple-300" />
            <span className="text-3xl font-bold text-white">{stats.totalCards}</span>
          </div>
          <div className="text-purple-200 font-medium">Tarjetas Emitidas</div>
        </div>

        <div className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-orange-300" />
            <span className="text-3xl font-bold text-white">{stats.totalLoans}</span>
          </div>
          <div className="text-orange-200 font-medium">Préstamos Totales</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-emerald-500" />
            <h3 className="text-lg font-semibold">Seguros y Inversiones</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-gray-400">Seguros Contratados</span>
              <span className="text-xl font-bold">{stats.totalInsurances}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Inversiones Activas</span>
              <span className="text-xl font-bold">{stats.totalInvestments}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h3 className="text-lg font-semibold">Métricas Financieras</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-gray-400">Balance Total Sistema</span>
              <span className="text-xl font-bold text-emerald-500">€{stats.totalBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Préstamos Pendientes</span>
              <span className={`text-xl font-bold ${stats.pendingLoans > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                {stats.pendingLoans}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Users className="h-5 w-5" />
            Ver Usuarios
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <DollarSign className="h-5 w-5" />
            Revisar Préstamos
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Activity className="h-5 w-5" />
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
