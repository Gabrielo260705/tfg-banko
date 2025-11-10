import { useState, useEffect } from 'react';
import { Send, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase, Account } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TransfersView = () => {
  const { profile } = useAuth();
  const [myAccounts, setMyAccounts] = useState<Account[]>([]);
  const [transfer, setTransfer] = useState({
    from_account_id: '',
    recipient_account_number: '',
    amount: 0,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMyAccounts();
  }, [profile]);

  const loadMyAccounts = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error loading accounts:', error);
      } else {
        setMyAccounts(data || []);
        if (data && data.length > 0) {
          setTransfer(prev => ({ ...prev, from_account_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Exception loading accounts:', err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !transfer.from_account_id || !transfer.recipient_account_number || transfer.amount <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    setLoading(true);

    try {
      const fromAccount = myAccounts.find(acc => acc.id === transfer.from_account_id);
      if (!fromAccount) {
        alert('Cuenta de origen no encontrada');
        setLoading(false);
        return;
      }

      if (Number(fromAccount.balance) < transfer.amount) {
        alert('Saldo insuficiente en la cuenta seleccionada');
        setLoading(false);
        return;
      }

      const { data: recipientAccount, error: recipientError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', transfer.recipient_account_number)
        .maybeSingle();

      if (recipientError) {
        console.error('Error finding recipient:', recipientError);
        alert('Error al buscar la cuenta destino');
        setLoading(false);
        return;
      }

      if (!recipientAccount) {
        alert('Número de cuenta destino no encontrado');
        setLoading(false);
        return;
      }

      if (recipientAccount.id === transfer.from_account_id) {
        alert('No puedes transferir a la misma cuenta');
        setLoading(false);
        return;
      }

      const newFromBalance = Number(fromAccount.balance) - transfer.amount;
      const { error: debitError } = await supabase
        .from('accounts')
        .update({ balance: newFromBalance })
        .eq('id', transfer.from_account_id);

      if (debitError) {
        console.error('Error debiting account:', debitError);
        alert('Error al debitar la cuenta: ' + debitError.message);
        setLoading(false);
        return;
      }

      const newToBalance = Number(recipientAccount.balance) + transfer.amount;
      const { error: creditError } = await supabase
        .from('accounts')
        .update({ balance: newToBalance })
        .eq('id', recipientAccount.id);

      if (creditError) {
        console.error('Error crediting account:', creditError);
        await supabase
          .from('accounts')
          .update({ balance: fromAccount.balance })
          .eq('id', transfer.from_account_id);
        alert('Error al acreditar la cuenta. La transacción ha sido revertida: ' + creditError.message);
        setLoading(false);
        return;
      }

      const { error: transactionError1 } = await supabase
        .from('transactions')
        .insert({
          account_id: transfer.from_account_id,
          transaction_type: 'transfer',
          amount: -transfer.amount,
          currency: fromAccount.currency,
          description: `Transferencia a ${transfer.recipient_account_number}: ${transfer.description}`,
          recipient_account: transfer.recipient_account_number,
        });

      const { error: transactionError2 } = await supabase
        .from('transactions')
        .insert({
          account_id: recipientAccount.id,
          transaction_type: 'transfer',
          amount: transfer.amount,
          currency: recipientAccount.currency,
          description: `Transferencia desde ${fromAccount.account_number}: ${transfer.description}`,
          recipient_account: fromAccount.account_number,
        });

      if (transactionError1 || transactionError2) {
        console.error('Error creating transactions:', transactionError1, transactionError2);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTransfer({
          from_account_id: myAccounts[0]?.id || '',
          recipient_account_number: '',
          amount: 0,
          description: '',
        });
        loadMyAccounts();
      }, 3000);
    } catch (err) {
      console.error('Exception during transfer:', err);
      alert('Error al realizar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = myAccounts.find(acc => acc.id === transfer.from_account_id);

  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <CheckCircle className="h-24 w-24 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Transferencia Exitosa!</h2>
          <p className="text-gray-400">La transferencia se ha realizado correctamente</p>
          <p className="text-sm text-gray-500 mt-2">€{transfer.amount.toFixed(2)} enviados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Transferir Dinero</h2>

      {myAccounts.length === 0 ? (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6 text-center">
          <p className="text-yellow-400">No tienes cuentas disponibles. Crea una cuenta primero.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cuenta de Origen
              </label>
              <select
                value={transfer.from_account_id}
                onChange={(e) => setTransfer({ ...transfer, from_account_id: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                required
              >
                <option value="">Seleccionar cuenta</option>
                {myAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number} - {acc.currency} - €{Number(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Saldo Disponible</div>
                <div className="text-2xl font-bold text-emerald-500">
                  {selectedAccount.currency === 'EUR' && '€'}
                  {selectedAccount.currency === 'GBP' && '£'}
                  {selectedAccount.currency === 'USD' && '$'}
                  {Number(selectedAccount.balance).toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Cuenta Destino
              </label>
              <input
                type="text"
                value={transfer.recipient_account_number}
                onChange={(e) => setTransfer({ ...transfer, recipient_account_number: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                placeholder="ES1234567890123456789012"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Introduce el número de cuenta completo del destinatario
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cantidad
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input
                  type="number"
                  value={transfer.amount || ''}
                  onChange={(e) => setTransfer({ ...transfer, amount: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concepto
              </label>
              <input
                type="text"
                value={transfer.description}
                onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                placeholder="Descripción de la transferencia"
                required
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Comisión</span>
                <span className="text-white font-medium">€0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total a transferir</span>
                <span className="text-emerald-500 font-bold text-lg">€{transfer.amount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !transfer.from_account_id || !transfer.recipient_account_number || transfer.amount <= 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Procesando...</>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Transferir
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold mb-2 text-blue-400">Información Importante</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Las transferencias son instantáneas y sin comisión</li>
          <li>• Verifica el número de cuenta del destinatario antes de enviar</li>
          <li>• El saldo se actualizará inmediatamente en ambas cuentas</li>
          <li>• Guarda el comprobante para futuras referencias</li>
        </ul>
      </div>
    </div>
  );
};
