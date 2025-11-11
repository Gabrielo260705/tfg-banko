import { useEffect, useState } from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { supabase, Investment, Account } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const investmentFunds = [
  { name: 'Vanguard Total Stock Market', type: 'funds', rate: 7.5, risk: 'Medio', description: 'Fondo indexado diversificado' },
  { name: 'BlackRock Global Allocation', type: 'funds', rate: 6.2, risk: 'Bajo', description: 'Equilibrio global de activos' },
  { name: 'Fidelity International', type: 'funds', rate: 8.1, risk: 'Medio-Alto', description: 'Mercados internacionales' },
  { name: 'PIMCO Income Fund', type: 'funds', rate: 5.5, risk: 'Bajo', description: 'Enfoque en renta fija' },
  { name: 'T. Rowe Price Equity', type: 'funds', rate: 9.3, risk: 'Alto', description: 'Crecimiento agresivo' },
];

const stockOptions = [
  { name: 'Apple Inc.', ticker: 'AAPL', type: 'stocks', rate: 12.5, sector: 'Tecnología' },
  { name: 'Microsoft Corp.', ticker: 'MSFT', type: 'stocks', rate: 11.8, sector: 'Tecnología' },
  { name: 'Amazon.com Inc.', ticker: 'AMZN', type: 'stocks', rate: 10.2, sector: 'E-commerce' },
  { name: 'Tesla Inc.', ticker: 'TSLA', type: 'stocks', rate: 15.7, sector: 'Automotriz' },
  { name: 'NVIDIA Corp.', ticker: 'NVDA', type: 'stocks', rate: 18.3, sector: 'Tecnología' },
];

export const InvestmentsView = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'simulator' | 'market'>('portfolio');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [sellAccountId, setSellAccountId] = useState('');
  const [newInvestment, setNewInvestment] = useState({
    investment_type: 'stocks' as 'stocks' | 'funds',
    name: '',
    amount_invested: 1000,
    interest_rate: 5,
    account_id: '',
  });

  const [simulator, setSimulator] = useState({
    principal: 10000,
    rate: 5,
    years: 10,
    result: 0,
  });

  useEffect(() => {
    loadInvestments();
    loadAccounts();
  }, [profile]);

  const loadInvestments = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', profile.id)
      .order('purchase_date', { ascending: false });

    setInvestments(data || []);
  };

  const loadAccounts = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', profile.id);

    setAccounts(data || []);
  };

  const createInvestment = async () => {
    if (!profile || !newInvestment.name || !newInvestment.account_id) return;

    const selectedAccount = accounts.find(acc => acc.id === newInvestment.account_id);
    if (!selectedAccount) return;

    if (Number(selectedAccount.balance) < newInvestment.amount_invested) {
      alert('Saldo insuficiente en la cuenta seleccionada');
      return;
    }

    const newBalance = Number(selectedAccount.balance) - newInvestment.amount_invested;

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', newInvestment.account_id);

    if (accountError) {
      alert('Error al actualizar la cuenta');
      return;
    }

    const { data: bankAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', 'BANKO-SYSTEM-ACCOUNT-001')
      .maybeSingle();

    if (bankAccount) {
      await supabase
        .from('accounts')
        .update({ balance: Number(bankAccount.balance) + newInvestment.amount_invested })
        .eq('id', bankAccount.id);

      await supabase.from('transactions').insert({
        account_id: bankAccount.id,
        transaction_type: 'deposit',
        amount: newInvestment.amount_invested,
        currency: 'EUR',
        description: `Inversión recibida - ${newInvestment.name} - De: ${selectedAccount.account_number}`,
        recipient_account: selectedAccount.account_number,
        is_suspicious: false,
      });
    }

    const { error } = await supabase
      .from('investments')
      .insert({
        user_id: profile.id,
        investment_type: newInvestment.investment_type,
        name: newInvestment.name,
        amount_invested: newInvestment.amount_invested,
        current_value: newInvestment.amount_invested,
        interest_rate: newInvestment.interest_rate,
      });

    if (!error) {
      await supabase.from('transactions').insert({
        account_id: newInvestment.account_id,
        transaction_type: 'payment',
        amount: -newInvestment.amount_invested,
        currency: selectedAccount.currency,
        description: `Inversión en ${newInvestment.name}`,
        recipient_account: bankAccount?.account_number,
        is_suspicious: false,
      });

      setShowCreateModal(false);
      setNewInvestment({
        investment_type: 'stocks',
        name: '',
        amount_invested: 1000,
        interest_rate: 5,
        account_id: '',
      });
      loadInvestments();
      loadAccounts();
    }
  };

  const sellInvestment = async () => {
    if (!selectedInvestment || !sellAccountId) return;

    const account = accounts.find(acc => acc.id === sellAccountId);
    if (!account) return;

    const { data: bankAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', 'BANKO-SYSTEM-ACCOUNT-001')
      .maybeSingle();

    if (!bankAccount) {
      alert('Cuenta del banco no encontrada');
      return;
    }

    if (Number(bankAccount.balance) < Number(selectedInvestment.current_value)) {
      alert('El banco no tiene fondos suficientes para recomprar la inversión');
      return;
    }

    const newBalance = Number(account.balance) + Number(selectedInvestment.current_value);
    const newBankBalance = Number(bankAccount.balance) - Number(selectedInvestment.current_value);

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', sellAccountId);

    if (accountError) {
      alert('Error al actualizar la cuenta');
      return;
    }

    await supabase
      .from('accounts')
      .update({ balance: newBankBalance })
      .eq('id', bankAccount.id);

    const { error: investmentError } = await supabase
      .from('investments')
      .delete()
      .eq('id', selectedInvestment.id);

    if (investmentError) {
      alert('Error al vender la inversión');
      return;
    }

    await supabase.from('transactions').insert([
      {
        account_id: sellAccountId,
        transaction_type: 'deposit',
        amount: Number(selectedInvestment.current_value),
        currency: account.currency,
        description: `Venta de ${selectedInvestment.name}`,
        recipient_account: bankAccount.account_number,
        is_suspicious: false,
      },
      {
        account_id: bankAccount.id,
        transaction_type: 'payment',
        amount: -Number(selectedInvestment.current_value),
        currency: 'EUR',
        description: `Recompra de inversión - ${selectedInvestment.name} - A: ${account.account_number}`,
        recipient_account: account.account_number,
        is_suspicious: false,
      }
    ]);

    setShowSellModal(false);
    setSelectedInvestment(null);
    setSellAccountId('');
    loadInvestments();
    loadAccounts();
  };

  const calculateCompoundInterest = () => {
    const { principal, rate, years } = simulator;
    const result = principal * Math.pow(1 + rate / 100, years);
    setSimulator({ ...simulator, result });
  };

  useEffect(() => {
    calculateCompoundInterest();
  }, [simulator.principal, simulator.rate, simulator.years]);

  const getInvestmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stocks: 'Acciones',
      funds: 'Fondos',
      savings_account: 'Cuenta de Ahorro',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inversiones</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Inversión
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'portfolio' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Mi Cartera
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'market' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Mercado
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'simulator' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Simulador
        </button>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tienes inversiones activas. Comienza a invertir ahora.
            </div>
          ) : (
            investments.map((inv) => (
              <div key={inv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{inv.name}</h3>
                    <p className="text-sm text-gray-400">{getInvestmentTypeLabel(inv.investment_type)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-400">Inversión Inicial</div>
                    <div className="text-lg font-semibold">€{Number(inv.amount_invested).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Valor Actual</div>
                    <div className="text-lg font-semibold text-emerald-500">€{Number(inv.current_value).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Rentabilidad</div>
                    <div className={`text-lg font-semibold ${
                      Number(inv.current_value) >= Number(inv.amount_invested) ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {(((Number(inv.current_value) - Number(inv.amount_invested)) / Number(inv.amount_invested)) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvestment(inv);
                    setShowSellModal(true);
                  }}
                  className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Vender Acciones (€{Number(inv.current_value).toFixed(2)})
                </button>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'market' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Fondos de Inversión</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {investmentFunds.map((fund, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-emerald-600 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{fund.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{fund.description}</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Rentabilidad Anual</div>
                      <div className="text-lg font-bold text-emerald-500">{fund.rate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Riesgo</div>
                      <div className="text-sm font-semibold">{fund.risk}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewInvestment({
                        ...newInvestment,
                        investment_type: 'funds',
                        name: fund.name,
                        interest_rate: fund.rate
                      });
                      setShowCreateModal(true);
                    }}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    Invertir
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Acciones</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {stockOptions.map((stock, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-emerald-600 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{stock.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{stock.ticker} • {stock.sector}</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500">Rentabilidad Estimada</div>
                    <div className="text-lg font-bold text-emerald-500">{stock.rate}%</div>
                  </div>
                  <button
                    onClick={() => {
                      setNewInvestment({
                        ...newInvestment,
                        investment_type: 'stocks',
                        name: stock.name,
                        interest_rate: stock.rate
                      });
                      setShowCreateModal(true);
                    }}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    Comprar Acciones
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Simulador de Interés Compuesto</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inversión Inicial (€)
                </label>
                <input
                  type="number"
                  value={simulator.principal}
                  onChange={(e) => setSimulator({ ...simulator, principal: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Interés Anual (%)
                </label>
                <input
                  type="number"
                  value={simulator.rate}
                  onChange={(e) => setSimulator({ ...simulator, rate: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Años
                </label>
                <input
                  type="number"
                  value={simulator.years}
                  onChange={(e) => setSimulator({ ...simulator, years: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center items-center bg-gray-800 rounded-lg p-6">
              <TrendingUp className="h-16 w-16 text-emerald-500 mb-4" />
              <div className="text-sm text-gray-400 mb-2">Valor Final Estimado</div>
              <div className="text-4xl font-bold text-emerald-500 mb-4">
                €{simulator.result.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-400">
                Ganancia: €{(simulator.result - simulator.principal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-emerald-500 mt-1">
                +{(((simulator.result - simulator.principal) / simulator.principal) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Vender Inversión</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Inversión</div>
                <div className="text-lg font-semibold">{selectedInvestment.name}</div>
                <div className="text-sm text-gray-400 mt-2">Valor de Venta</div>
                <div className="text-2xl font-bold text-emerald-500">
                  €{Number(selectedInvestment.current_value).toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta de Destino
                </label>
                <select
                  value={sellAccountId}
                  onChange={(e) => setSellAccountId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - €{Number(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-orange-900/20 border border-orange-800 rounded-lg text-orange-400 text-sm">
                <p>El dinero se depositará en la cuenta seleccionada. Esta acción no se puede deshacer.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSellModal(false);
                    setSelectedInvestment(null);
                    setSellAccountId('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={sellInvestment}
                  disabled={!sellAccountId}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Nueva Inversión</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta de Origen
                </label>
                <select
                  value={newInvestment.account_id}
                  onChange={(e) => setNewInvestment({ ...newInvestment, account_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - €{Number(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Inversión
                </label>
                <select
                  value={newInvestment.investment_type}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investment_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="stocks">Acciones</option>
                  <option value="funds">Fondos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  placeholder="Ej: Apple Inc, Fondo Indexado S&P500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad a Invertir (€)
                </label>
                <input
                  type="number"
                  value={newInvestment.amount_invested}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount_invested: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Interés Esperada (%)
                </label>
                <input
                  type="number"
                  value={newInvestment.interest_rate}
                  onChange={(e) => setNewInvestment({ ...newInvestment, interest_rate: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createInvestment}
                  disabled={!newInvestment.name || !newInvestment.account_id}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invertir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
