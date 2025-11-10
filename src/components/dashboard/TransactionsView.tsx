import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TransactionsView = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [profile]);

  const loadTransactions = async () => {
    if (!profile) return;

    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', profile.id);

      if (accountsError) {
        console.error('Error loading accounts:', accountsError);
        return;
      }

      if (!accounts?.length) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('account_id', accounts.map(a => a.id))
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Exception loading transactions:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transacciones</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <Filter className="h-5 w-5" />
          Filtrar
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.amount > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      {tx.transaction_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{tx.description}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-12 text-gray-500">No hay transacciones</div>
          )}
        </div>
      </div>
    </div>
  );
};
