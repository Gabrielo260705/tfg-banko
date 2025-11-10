import { useEffect, useState } from 'react';
import { Plus, Wallet, ArrowLeftRight, Download } from 'lucide-react';
import { supabase, Account } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const AccountsView = () => {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    currency: 'EUR' as 'EUR' | 'GBP' | 'USD',
    account_type: 'checking' as 'checking' | 'savings',
  });
  const [exchangeRates] = useState({ EUR: 1, GBP: 0.86, USD: 1.09 });

  useEffect(() => {
    loadAccounts();
  }, [profile]);

  const loadAccounts = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
      } else if (data) {
        setAccounts(data);
      }
    } catch (err) {
      console.error('Exception loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!profile) return;

    const accountNumber = `ES${Math.random().toString().slice(2, 22)}`;

    const { error } = await supabase
      .from('accounts')
      .insert({
        user_id: profile.id,
        account_number: accountNumber,
        currency: newAccount.currency,
        account_type: newAccount.account_type,
        balance: 0,
      });

    if (!error) {
      setShowCreateModal(false);
      loadAccounts();
    }
  };

  const convertCurrency = (amount: number, from: string, to: string = 'EUR'): number => {
    if (from === to) return amount;
    const rateFrom = exchangeRates[from as keyof typeof exchangeRates] || 1;
    const rateTo = exchangeRates[to as keyof typeof exchangeRates] || 1;
    return (amount / rateFrom) * rateTo;
  };

  const getTotalInEUR = () => {
    return accounts.reduce((sum, acc) => {
      return sum + convertCurrency(Number(acc.balance), acc.currency);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Cargando cuentas...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">No se pudo cargar el perfil de usuario</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mis Cuentas</h2>
          <p className="text-gray-400 mt-1">Balance total: €{getTotalInEUR().toFixed(2)}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Cuenta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-600/20 rounded-lg">
                <Wallet className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded">
                {account.currency}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {account.currency === 'EUR' && '€'}
              {account.currency === 'GBP' && '£'}
              {account.currency === 'USD' && '$'}
              {Number(account.balance).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mb-4">
              {account.account_type === 'checking' ? 'Cuenta Corriente' : 'Cuenta de Ahorro (2% anual)'}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {account.account_number}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Transferir
              </button>
              <button
                onClick={() => {
                  const statement = `EXTRACTO DE CUENTA\n\nNúmero de cuenta: ${account.account_number}\nTipo: ${account.account_type === 'checking' ? 'Cuenta Corriente' : 'Cuenta de Ahorro'}\nDivisa: ${account.currency}\nBalance actual: ${account.currency === 'EUR' ? '€' : account.currency === 'GBP' ? '£' : '$'}${Number(account.balance).toFixed(2)}\n\nFecha: ${new Date().toLocaleDateString('es-ES')}`;
                  const blob = new Blob([statement], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `extracto_${account.account_number}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                Extracto
              </button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tienes cuentas bancarias. Crea una para empezar.
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Crear Nueva Cuenta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={newAccount.account_type}
                  onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Divisa
                </label>
                <select
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - Libra Esterlina</option>
                  <option value="USD">USD - Dólar Americano</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAccount}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Crear Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Realizar Transferencia</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta Origen
                </label>
                <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} ({acc.currency} - €{Number(acc.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta Destino
                </label>
                <input
                  type="text"
                  placeholder="ES1234567890123456789012"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Concepto
                </label>
                <input
                  type="text"
                  placeholder="Descripción de la transferencia"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Transferir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
