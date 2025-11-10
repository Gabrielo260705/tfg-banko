import { useEffect, useState } from 'react';
import { Wallet, CreditCard, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const OverviewView = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalBalance: 0,
    activeCards: 0,
    activeLoans: 0,
    totalInvestments: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentTransactions();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance, currency')
      .eq('user_id', profile.id);

    const { data: cards } = await supabase
      .from('cards')
      .select('id')
      .eq('is_active', true)
      .in('account_id', (accounts || []).map(a => a.id));

    const { data: loans } = await supabase
      .from('loans')
      .select('remaining_balance')
      .eq('user_id', profile.id)
      .eq('status', 'active');

    const { data: investments } = await supabase
      .from('investments')
      .select('current_value')
      .eq('user_id', profile.id);

    const totalBalance = (accounts || []).reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalInvestments = (investments || []).reduce((sum, inv) => sum + Number(inv.current_value), 0);

    setStats({
      totalBalance,
      activeCards: cards?.length || 0,
      activeLoans: loans?.length || 0,
      totalInvestments,
    });
  };

  const loadRecentTransactions = async () => {
    if (!profile) return;

    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', profile.id);

    if (!accounts?.length) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .in('account_id', accounts.map(a => a.id))
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentTransactions(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-600/20 rounded-lg">
              <Wallet className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            €{stats.totalBalance.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Balance Total</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.activeCards}</div>
          <div className="text-sm text-gray-400">Tarjetas Activas</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.activeLoans}</div>
          <div className="text-sm text-gray-400">Préstamos Activos</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            €{stats.totalInvestments.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Inversiones</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Transacciones Recientes</h3>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay transacciones recientes</p>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.amount > 0 ? 'bg-emerald-600/20' : 'bg-red-600/20'
                  }`}>
                    {tx.amount > 0 ? (
                      <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">¡Bienvenido a Banko!</h3>
        <p className="text-gray-300">
          Gestiona tus finanzas de forma segura y eficiente. Explora todas las funciones disponibles en el menú lateral.
        </p>
      </div>
    </div>
  );
};
